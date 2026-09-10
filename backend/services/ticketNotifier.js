"use strict";

/**
 * ticketNotifier.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Email dispatch layer for the AI Support Agent.
 * Uses the existing sendEmail utility — no new dependencies.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const sendEmail = require("../utils/sendEmail");

const BRAND = "SkillBridge";
const SUPPORT_EMAIL = process.env.EMAIL_USER || "support@skillbridge.com";
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_USER;

// ─── Shared HTML shell ────────────────────────────────────────────────────────

function htmlShell(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:20px 32px;">
            <span style="color:#34d399;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${BRAND}</span>
            <span style="color:#64748b;font-size:13px;margin-left:12px;">Support</span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;color:#1e293b;font-size:14px;line-height:1.7;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${title}</h2>
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f1f5f9;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              This is an automated message from ${BRAND} Support &lt;${SUPPORT_EMAIL}&gt;.
              Do not reply to this email directly — open a new support ticket if you need further help.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── User-facing outcome emails ───────────────────────────────────────────────

/**
 * notifyResolved
 * Sent to the reporter when the agent auto-resolved the issue.
 */
async function notifyResolved(ticket, resolverMessage) {
  const ticketRef = `#${String(ticket._id).slice(-8).toUpperCase()}`;
  const subject = `✓ Your issue has been resolved — ${BRAND} Support [${ticketRef}]`;

  const body = `
    <p>Hi there,</p>
    <p>Good news — our automated support agent reviewed your report and was able to resolve it:</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:16px 0;color:#166534;">
      <strong>Resolution:</strong><br/>${resolverMessage}
    </div>
    ${ticket.aiSummary ? `<p style="color:#475569;font-size:13px;"><strong>AI Summary:</strong> ${ticket.aiSummary}</p>` : ""}
    <p>If this doesn't fully address your concern, simply reply by opening a new ticket — a human will follow up.</p>
    <p style="color:#64748b;font-size:12px;">Ticket Ref: ${ticketRef} &nbsp;|&nbsp; Category: ${ticket.category}</p>
  `;

  await sendEmail(ticket.email, subject, htmlShell("Your Issue Has Been Resolved", body));
}

/**
 * notifyInProgress
 * Sent to the reporter when the issue needs human review (medium/high severity
 * or no auto-resolver available).
 */
async function notifyInProgress(ticket) {
  const ticketRef = `#${String(ticket._id).slice(-8).toUpperCase()}`;
  const subject = `We received your report — ${BRAND} Support [${ticketRef}]`;

  const severityNote =
    ticket.severity === "high"
      ? '<p style="color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px 14px;"><strong>⚠️ High Priority:</strong> This report has been flagged as urgent and escalated to our team.</p>'
      : "";

  const body = `
    <p>Hi there,</p>
    <p>We've received your support report and our team is reviewing it.</p>
    ${severityNote}
    ${ticket.aiSummary ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin:14px 0;"><strong>Issue Summary:</strong> ${ticket.aiSummary}</div>` : ""}
    <p>You don't need to do anything right now. We'll reach out if we need more details.</p>
    <p style="color:#64748b;font-size:12px;">Ticket Ref: ${ticketRef} &nbsp;|&nbsp; Category: ${ticket.category} &nbsp;|&nbsp; Severity: ${ticket.severity}</p>
  `;

  await sendEmail(ticket.email, subject, htmlShell("We're On It", body));
}

/**
 * notifySpamClosed
 * Sent when a ticket is auto-closed as spam/test.
 */
async function notifySpamClosed(ticket) {
  const ticketRef = `#${String(ticket._id).slice(-8).toUpperCase()}`;
  const subject = `Report received — ${BRAND} Support [${ticketRef}]`;

  const body = `
    <p>Hi there,</p>
    <p>We received your submission. It was identified as a test or non-actionable message and has been closed automatically.</p>
    <p>If you submitted this in error and have a real issue to report, please open a new ticket with more detail about the problem you're experiencing.</p>
    <p style="color:#64748b;font-size:12px;">Ticket Ref: ${ticketRef}</p>
  `;

  await sendEmail(ticket.email, subject, htmlShell("Submission Received", body));
}

// ─── Admin escalation & new ticket notification email ─────────────────────────

/**
 * notifyAdminNewTicket
 * Dispatched to ADMIN_ALERT_EMAIL for all non-spam tickets so admins are immediately informed.
 */
async function notifyAdminNewTicket(ticket, outcome) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.EMAIL_USER || "admin@gmail.com";
  if (!adminEmail) return;

  const ticketRef = `#${String(ticket._id).slice(-8).toUpperCase()}`;
  const isHigh = outcome.isHighSeverity || ticket.severity === "high";
  const subject = `${isHigh ? "🔴 [HIGH PRIORITY]" : "🎫 [NEW TICKET]"} Issue Raised [${ticketRef}] — ${ticket.category || "Support"}`;

  const body = `
    <p><strong>A new issue ticket has been raised on SkillBridge and requires attention.</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:16px 0;">
      <tr style="background:${isHigh ? "#fef2f2" : "#f8fafc"};">
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;width:130px;">Ticket Ref</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-weight:bold;">${ticketRef}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Reporter Email</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;">${ticket.email}</td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Status</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:bold;color:${outcome.finalStatus === 'resolved' ? '#16a34a' : '#2563eb'};">
          ${outcome.finalStatus.toUpperCase()}
        </td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Severity / Category</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;">${ticket.severity?.toUpperCase() || "NORMAL"} &nbsp;|&nbsp; ${ticket.category || "General"}</td>
      </tr>
      <tr style="background:#fafafa;">
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Page URL</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;">${ticket.pageUrl || "—"}</td>
      </tr>
      ${ticket.aiSummary ? `
      <tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">AI Summary</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;">${ticket.aiSummary}</td>
      </tr>` : ""}
      <tr style="background:#fafafa;">
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;vertical-align:top;">Description</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;">${ticket.description}</td>
      </tr>
    </table>
    <p style="margin-top:18px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dashboard" style="display:inline-block;padding:10px 20px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px;">
        Open Admin Support Desk &rarr;
      </a>
    </p>
  `;

  await sendEmail(adminEmail, subject, htmlShell(isHigh ? "🔴 High-Severity Alert" : "🎫 New Ticket Raised", body));
}

// ─── Public interface ─────────────────────────────────────────────────────────

/**
 * dispatch(ticket, outcome)
 *
 * outcome: {
 *   finalStatus: "resolved" | "in_progress" | "closed",
 *   resolverMessage: string | null,
 *   isHighSeverity: boolean,
 *   isSpam: boolean,
 * }
 */
async function dispatch(ticket, outcome) {
  const { finalStatus, resolverMessage, isHighSeverity, isSpam } = outcome;

  const emailPromises = [];

  // User-facing outcome email
  if (isSpam) {
    emailPromises.push(notifySpamClosed(ticket));
  } else if (finalStatus === "resolved" && resolverMessage) {
    emailPromises.push(notifyResolved(ticket, resolverMessage));
  } else {
    emailPromises.push(notifyInProgress(ticket));
  }

  // Admin notification email: for all non-spam tickets so admins are alerted
  if (!isSpam) {
    emailPromises.push(notifyAdminNewTicket(ticket, outcome));
  }

  // Fire both in parallel — failures are caught by the caller
  await Promise.allSettled(emailPromises);
}

module.exports = { dispatch };
