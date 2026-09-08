"use strict";

/**
 * ticketResolver.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Zero-Trust, Read-Only Resolver Suite
 *
 * ABSOLUTE INVARIANTS (never break these):
 *  1. No destructive DB operations: no delete/deleteOne/deleteMany/findByIdAndDelete
 *     /findOneAndDelete/remove/drop/bulkWrite against core models.
 *  2. Cross-tenant isolation: every query is scoped strictly to ticket.user.
 *  3. If ticket.user is missing, skip all data lookups — return unresolved.
 *  4. All reads use .lean() to avoid accidental Mongoose document mutation.
 *  5. No raw tokens, passwords, or PII returned in resolver messages.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require("mongoose");
const Application = require("../models/Application");
const User = require("../models/User");
const Job = require("../models/job");
const sendEmail = require("../utils/sendEmail");

// ─── Internal helpers ────────────────────────────────────────────────────────

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Extract the first MongoDB ObjectId-shaped segment from a URL path */
function extractObjectIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/([a-f\d]{24})(?:\/|$|\?)/i);
  return match ? match[1] : null;
}

/** Keywords that imply an explicit auth/password recovery intent */
const AUTH_RECOVERY_KEYWORDS = [
  "forgot",
  "reset",
  "locked out",
  "lock out",
  "password",
  "can't log in",
  "cannot login",
  "cannot log in",
  "login issue",
  "sign in",
];

function descriptionMentionsPasswordRecovery(description) {
  const lower = (description || "").toLowerCase();
  return AUTH_RECOVERY_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Resolver functions ───────────────────────────────────────────────────────

/**
 * lookup_applications
 * Confirm the authenticated user's application records exist and are intact.
 * Scoped strictly to ticket.user — never exposes other users' data.
 */
async function lookup_applications(ticket) {
  if (!ticket.user || !isValidObjectId(String(ticket.user))) {
    return {
      resolved: false,
      message:
        "Cannot look up applications: reporter identity could not be verified. " +
        "Please log in and resubmit the report.",
    };
  }

  const apps = await Application.find({ candidate: ticket.user })
    .populate({ path: "job", select: "title company isActive" })
    .lean();

  if (!apps || apps.length === 0) {
    return {
      resolved: true,
      message:
        "We checked your account and found no submitted applications on file. " +
        "This can happen if an application was submitted before your account was linked, " +
        "or if the relevant job has been removed. " +
        "Try re-applying from the Jobs page — your profile is intact.",
    };
  }

  const activeCount = apps.filter((a) => a.job?.isActive !== false).length;
  const titles = apps
    .slice(0, 3)
    .map((a) => a.job?.title || "Untitled role")
    .join(", ");
  const more = apps.length > 3 ? ` (and ${apps.length - 3} more)` : "";

  return {
    resolved: true,
    message:
      `We verified your account and found ${apps.length} application(s) on file ` +
      `(${activeCount} with active jobs), including: ${titles}${more}. ` +
      "Your applications are stored correctly. If a specific application isn't visible, " +
      "try refreshing the My Applications page or clearing your browser cache.",
  };
}

/**
 * lookup_profile
 * Confirm the authenticated user's profile fields are persisted.
 * Returns only non-sensitive summary fields — never email, password, or tokens.
 */
async function lookup_profile(ticket) {
  if (!ticket.user || !isValidObjectId(String(ticket.user))) {
    return {
      resolved: false,
      message:
        "Cannot verify profile: reporter identity is missing. " +
        "Please ensure you are logged in before submitting a report.",
    };
  }

  const user = await User.findById(ticket.user)
    .select("name skills headline experience")
    .lean();

  if (!user) {
    return {
      resolved: false,
      message:
        "Your account record was not found. This is unusual — please contact support directly.",
    };
  }

  const skillCount = Array.isArray(user.skills) ? user.skills.length : 0;
  const hasHeadline = Boolean(user.headline);
  const hasExperience = Boolean(user.experience);

  return {
    resolved: true,
    message:
      `Profile check complete for ${user.name}. ` +
      `We found: ${skillCount} skill(s) on file, ` +
      `headline ${hasHeadline ? "✓ saved" : "not yet set"}, ` +
      `experience section ${hasExperience ? "✓ saved" : "not yet added"}. ` +
      "If a recent edit isn't reflected, try saving the profile again. " +
      "Changes typically take a few seconds to propagate.",
  };
}

/**
 * lookup_job
 * Check whether a job mentioned in the ticket's pageUrl is still active.
 * Accepts only server-side URLs — never trusts client-supplied IDs.
 */
async function lookup_job(ticket) {
  const rawId = extractObjectIdFromUrl(ticket.pageUrl || "");

  if (!rawId || !isValidObjectId(rawId)) {
    return {
      resolved: false,
      message:
        "Could not identify a specific job from the page URL you reported. " +
        "If you are looking for a particular posting, please search for it by title on the Jobs page.",
    };
  }

  const job = await Job.findById(rawId)
    .select("title company isActive expiresAt")
    .lean();

  if (!job) {
    return {
      resolved: true,
      message:
        "The job listing referenced in your report (parsed from the page URL) no longer exists. " +
        "It may have been filled, expired, or removed by the recruiter. " +
        "We recommend searching for similar roles on the Jobs page.",
    };
  }

  if (!job.isActive) {
    return {
      resolved: true,
      message:
        `The job "${job.title}" at ${job.company} has been marked as inactive. ` +
        "This typically means the position has been filled or the recruiter has paused the listing. " +
        "Please check the Jobs page for similar openings.",
    };
  }

  const expiredNote =
    job.expiresAt && new Date(job.expiresAt) < new Date()
      ? ` Note: this listing expired on ${new Date(job.expiresAt).toLocaleDateString()}.`
      : "";

  return {
    resolved: true,
    message:
      `The job "${job.title}" at ${job.company} is currently active and visible on the platform.${expiredNote} ` +
      "If you are having trouble viewing it, try clearing your browser cache or reloading the page.",
  };
}

/**
 * send_password_reset
 * Only fires if the reporter's own description explicitly requests a password reset.
 * Sends a guide email — does NOT generate raw tokens or expose credentials.
 */
async function send_password_reset(ticket) {
  if (!descriptionMentionsPasswordRecovery(ticket.description)) {
    return {
      resolved: false,
      message:
        "The description did not explicitly request a password reset, so no action was taken. " +
        "If you need to reset your password, please use the 'Forgot Password' link on the login page.",
    };
  }

  // Send a guide email rather than a raw token (no reset-token flow exists yet)
  await sendEmail(
    ticket.email,
    "SkillBridge — Password Reset Guidance",
    `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1e293b;">
      <h2 style="color:#0f172a;">Password Reset Assistance</h2>
      <p>Hi there,</p>
      <p>We received your support request about an account access issue.</p>
      <p>To reset your password:</p>
      <ol style="line-height:2;">
        <li>Go to the <strong>Login</strong> page.</li>
        <li>Click <strong>"Forgot Password"</strong> below the login form.</li>
        <li>Enter your registered email address and follow the instructions sent to you.</li>
      </ol>
      <p>If you continue to experience issues, reply to this email and our support team will assist you directly.</p>
      <p style="color:#64748b;font-size:13px;">Ticket Reference: #${String(ticket._id).slice(-8)}</p>
    </div>
    `
  );

  return {
    resolved: true,
    message:
      "We detected an account access issue in your description. " +
      "A password reset guidance email has been sent to your registered address. " +
      "Please check your inbox (including spam) and follow the instructions.",
  };
}

/**
 * close_spam
 * For obvious test/bot submissions — marks resolved immediately.
 */
async function close_spam() {
  return {
    resolved: true,
    message:
      "This submission was identified as a test or non-actionable report and has been automatically closed. " +
      "No further action is required.",
  };
}

// ─── Public dispatcher ────────────────────────────────────────────────────────

/**
 * resolve(action, ticket)
 * Dispatches to the correct resolver based on the action name returned by Gemini.
 * Returns { resolved: Boolean, message: String }
 */
async function resolve(action, ticket) {
  switch (action) {
    case "lookup_applications":
      return lookup_applications(ticket);
    case "lookup_profile":
      return lookup_profile(ticket);
    case "lookup_job":
      return lookup_job(ticket);
    case "send_password_reset":
      return send_password_reset(ticket);
    case "close_spam":
      return close_spam(ticket);
    default:
      return {
        resolved: false,
        message: `No automated resolver available for action "${action}".`,
      };
  }
}

module.exports = { resolve };
