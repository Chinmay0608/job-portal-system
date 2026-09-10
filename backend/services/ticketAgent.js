"use strict";

/**
 * ticketAgent.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Asynchronous AI Auto-Triage & Zero-Trust Resolution Agent
 *
 * Entry point: run(ticket)
 *
 * Pipeline:
 *   1. Sanitize PII from inputs sent to Gemini
 *   2. Call Gemini 2.0 Flash → classify { category, severity, summary,
 *      canAutoResolve, action }
 *   3. Gating: auto-resolve ONLY when severity === "low" && canAutoResolve
 *   4. Atomic conditional DB update (respects admin overrides)
 *   5. Dispatch email via ticketNotifier
 *   6. Append all steps to ticket.agentLog[]
 *
 * Security invariants:
 *   - Hard 30-second timeout via Promise.race
 *   - All promise rejections caught — never crashes Node process
 *   - No writes to core models (User, Job, Application, etc.)
 *   - Only SupportTicket is updated; only when status is still "open"
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { GoogleGenAI } = require("@google/genai");
const SupportTicket = require("../models/SupportTicket");
const User = require("../models/user");
const { resolve } = require("./ticketResolver");
const { dispatch } = require("./ticketNotifier");
const { createNotification } = require("../utils/notify");

const AGENT_TIMEOUT_MS = 30_000;

// ─── PII / sensitive data sanitizer ──────────────────────────────────────────

const PII_PATTERNS = [
  // JWT / Bearer tokens
  /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/gi,
  // Raw JWTs anywhere
  /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g,
  // Passwords in query strings
  /[?&]password=[^&\s]*/gi,
  // API keys (common patterns)
  /[?&](?:apikey|api_key|key|token|secret)=[^&\s]*/gi,
  // Authorization header values
  /authorization:\s*\S+/gi,
];

function sanitize(text) {
  if (!text) return "";
  return PII_PATTERNS.reduce(
    (t, pattern) => t.replace(pattern, "[REDACTED]"),
    String(text)
  );
}

// ─── Gemini classification ────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  "auth_issue",
  "application_missing",
  "profile_not_saved",
  "job_not_visible",
  "ui_bug",
  "performance",
  "data_corruption",
  "billing_or_access",
  "spam_or_test",
  "other",
]);

const VALID_SEVERITIES = new Set(["low", "medium", "high"]);

const VALID_ACTIONS = new Set([
  "lookup_applications",
  "lookup_profile",
  "lookup_job",
  "send_password_reset",
  "close_spam",
  "none",
]);

const SYSTEM_PROMPT = `You are a concise support ticket classifier for SkillBridge, a job portal web app.
Analyse the ticket and return ONLY a JSON object (no markdown, no prose) with exactly these fields:

{
  "category": one of [auth_issue, application_missing, profile_not_saved, job_not_visible, ui_bug, performance, data_corruption, billing_or_access, spam_or_test, other],
  "severity": one of [low, medium, high],
  "summary": "one sentence, ≤ 120 chars, describing the core issue",
  "canAutoResolve": true or false,
  "action": one of [lookup_applications, lookup_profile, lookup_job, send_password_reset, close_spam, none]
}

Classification guide:
- severity=high: data_corruption, billing_or_access, or any mention of data loss / account compromise
- severity=medium: auth_issue (unless it's a simple forgot-password), ui_bug blocking core workflow
- severity=low: everything else that has a clear automated action
- canAutoResolve=true ONLY when severity=low and a matching action exists
- action must map to: auth→send_password_reset, missing apps→lookup_applications, profile→lookup_profile, job→lookup_job, spam→close_spam, else→none
- If uncertain, default category=other, severity=medium, canAutoResolve=false, action=none`;

async function classifyWithGemini(description, pageUrl, userAgent) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const userMessage = [
    `Description: ${sanitize(description)}`,
    pageUrl ? `Page URL: ${sanitize(pageUrl)}` : "",
    userAgent ? `Browser/OS: ${sanitize(userAgent).substring(0, 120)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  });

  const raw = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Gemini returned unparseable JSON: ${raw.slice(0, 200)}`);
  }

  // Validate and fall back to safe defaults for any unexpected values
  const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : "other";
  const severity = VALID_SEVERITIES.has(parsed.severity) ? parsed.severity : "medium";
  const summary = typeof parsed.summary === "string" ? parsed.summary.slice(0, 120) : "";
  const canAutoResolve = parsed.canAutoResolve === true && severity === "low";
  const action = VALID_ACTIONS.has(parsed.action) ? parsed.action : "none";

  return { category, severity, summary, canAutoResolve, action };
}

// ─── Fallback keyword classifier (used when Gemini fails) ────────────────────

function classifyByKeywords(description) {
  const text = (description || "").toLowerCase();

  if (/spam|test(ing)?|hello world|asdf|lorem ipsum/i.test(text)) {
    return { category: "spam_or_test", severity: "low", summary: "Possible test or spam submission.", canAutoResolve: true, action: "close_spam" };
  }
  if (/forgot|reset|locked|password|log.?in|sign.?in/i.test(text)) {
    return { category: "auth_issue", severity: "low", summary: "Authentication / password issue reported.", canAutoResolve: true, action: "send_password_reset" };
  }
  if (/application|applied|not showing/i.test(text)) {
    return { category: "application_missing", severity: "low", summary: "Applications not visible to user.", canAutoResolve: true, action: "lookup_applications" };
  }
  if (/profile|save|update|not saved/i.test(text)) {
    return { category: "profile_not_saved", severity: "low", summary: "Profile data not persisting.", canAutoResolve: true, action: "lookup_profile" };
  }
  if (/job|listing|post|disappear/i.test(text)) {
    return { category: "job_not_visible", severity: "low", summary: "Job listing not visible.", canAutoResolve: true, action: "lookup_job" };
  }

  return { category: "other", severity: "medium", summary: "Issue could not be automatically classified.", canAutoResolve: false, action: "none" };
}

// ─── Atomic DB update ─────────────────────────────────────────────────────────

/**
 * Attempt to update the ticket, but only if it's still "open" (admin override guard).
 * Returns the updated ticket doc, or null if a human already changed the status.
 */
async function conditionalStatusUpdate(ticketId, fields) {
  return SupportTicket.findOneAndUpdate(
    { _id: ticketId, status: "open" },
    { $set: fields },
    { new: true }
  );
}

async function appendAgentLog(ticketId, entries) {
  await SupportTicket.updateOne(
    { _id: ticketId },
    { $push: { agentLog: { $each: entries } } }
  );
}

// ─── Main agent pipeline ──────────────────────────────────────────────────────

async function _run(ticket) {
  const log = [];
  const addLog = (action, detail = "") => {
    log.push({ action, detail, ts: new Date() });
  };

  addLog("agent_started", `Processing ticket ${ticket._id}`);

  // ── Step 1: Classify via Gemini (with keyword fallback) ──
  let classification;
  try {
    classification = await classifyWithGemini(
      ticket.description,
      ticket.pageUrl,
      ticket.userAgent
    );
    addLog("classified_by_gemini", `category=${classification.category} severity=${classification.severity} action=${classification.action}`);
  } catch (geminiErr) {
    addLog("gemini_error", String(geminiErr.message).slice(0, 200));
    classification = classifyByKeywords(ticket.description);
    addLog("classified_by_keywords", `category=${classification.category} severity=${classification.severity} action=${classification.action}`);
  }

  const { category, severity, summary, canAutoResolve, action } = classification;

  // ── Step 2: Determine outcome ──
  const isSpam = category === "spam_or_test";
  const isHighSeverity = severity === "high";
  let finalStatus = "in_progress";
  let resolverMessage = null;

  if (canAutoResolve && action !== "none") {
    addLog("resolver_invoked", `action=${action}`);
    try {
      const result = await resolve(action, ticket);
      resolverMessage = result.message;
      if (result.resolved) {
        finalStatus = isSpam ? "closed" : "resolved";
        addLog("resolver_succeeded", result.message.slice(0, 200));
      } else {
        addLog("resolver_skipped", result.message.slice(0, 200));
      }
    } catch (resolverErr) {
      addLog("resolver_error", String(resolverErr.message).slice(0, 200));
    }
  } else {
    addLog("auto_resolve_skipped", `canAutoResolve=${canAutoResolve} severity=${severity} action=${action}`);
  }

  // ── Step 3: Atomic DB update (respects admin override) ──
  const updateFields = {
    category,
    severity,
    aiSummary: summary,
    autoResolved: finalStatus === "resolved" || finalStatus === "closed",
    status: finalStatus,
  };

  const updated = await conditionalStatusUpdate(ticket._id, updateFields);

  if (!updated) {
    addLog("status_update_skipped", "Admin already changed the status — agent respects human override.");
  } else {
    addLog("status_updated", `status=${finalStatus} autoResolved=${updateFields.autoResolved}`);
  }

  // ── Step 4: Dispatch notification email ──
  try {
    const ticketDoc = typeof ticket.toObject === "function" ? ticket.toObject() : ticket;
    await dispatch(
      // Use the freshest ticket data available
      { ...ticketDoc, ...updateFields, _id: ticket._id, email: ticket.email },
      { finalStatus, resolverMessage, isHighSeverity, isSpam }
    );
    const notifiedAt = new Date();
    await SupportTicket.updateOne({ _id: ticket._id }, { $set: { notifiedAt } });
    addLog("email_dispatched", `to=${ticket.email} isHighSeverity=${isHighSeverity}`);
  } catch (emailErr) {
    addLog("email_error", String(emailErr.message).slice(0, 200));
  }

  // ── Step 4b: Dispatch in-app notification (if user is authenticated) ──
  if (ticket.user) {
    try {
      await createNotification({
        recipient: ticket.user,
        sender: null,
        type: "support_update",
        title: `Support Ticket ${finalStatus === "resolved" ? "Resolved" : "Update"}: ${summary ? summary.slice(0, 80) : "Triage Complete"}`,
        message: resolverMessage || `Your support ticket #${String(ticket._id).slice(-6)} has been updated to "${finalStatus}".`,
        priority: isHighSeverity ? "high" : "normal",
        actionUrl: "/help",
      });
      addLog("notification_created", `recipient=${ticket.user}`);
    } catch (notifErr) {
      addLog("notification_error", String(notifErr.message).slice(0, 200));
    }
  }

  // ── Step 4c: Dispatch in-app notification to all Admin accounts ──
  if (!isSpam) {
    try {
      const adminUsers = await User.find({ role: "admin" }).select("_id email").lean();
      if (adminUsers && adminUsers.length > 0) {
        const ticketRef = `#${String(ticket._id).slice(-6).toUpperCase()}`;
        const descSnippet = ticket.description
          ? (ticket.description.slice(0, 90) + (ticket.description.length > 90 ? "..." : ""))
          : "New issue reported";
        const adminTitle = `🎫 ${isHighSeverity ? "[URGENT] " : ""}Support Ticket ${ticketRef}`;
        const adminMsg = `${ticket.email || "A user"} reported: "${descSnippet}" on ${ticket.pageUrl || "app"} (${finalStatus.toUpperCase()})`;

        for (const admin of adminUsers) {
          await createNotification({
            recipient: admin._id,
            sender: ticket.user || null,
            type: "support_update",
            title: adminTitle,
            message: adminMsg,
            priority: isHighSeverity ? "urgent" : "high",
            actionUrl: "/admin/dashboard",
          });
        }
        addLog("admin_notification_created", `Notified ${adminUsers.length} admin(s)`);
      }
    } catch (adminErr) {
      addLog("admin_notification_error", String(adminErr.message).slice(0, 200));
    }
  }

  // ── Step 5: Flush agent log to DB ──
  addLog("agent_complete", `finalStatus=${finalStatus}`);
  await appendAgentLog(ticket._id, log);
}

/**
 * run(ticket)
 * Public entry point. Wraps the pipeline with a 30-second hard timeout.
 * All errors are caught — never throws to the caller.
 */
async function run(ticket) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Agent pipeline timed out after 30s")), AGENT_TIMEOUT_MS)
  );

  try {
    await Promise.race([_run(ticket), timeout]);
  } catch (err) {
    console.error(`[TicketAgent] Error for ticket ${ticket._id}:`, err.message);
    // Best-effort: append timeout/error log entry so the admin can see it
    try {
      await appendAgentLog(ticket._id, [
        { action: "agent_error", detail: err.message.slice(0, 300), ts: new Date() },
      ]);
    } catch {
      // Intentionally silent — DB may be unavailable
    }
  }
}

module.exports = { run };
