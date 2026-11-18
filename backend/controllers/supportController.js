"use strict";

const asyncHandler = require("express-async-handler");
const SupportTicket = require("../models/SupportTicket");
const User = require("../models/user");
const ticketAgent = require("../services/ticketAgent");
const { sendTicketAlertToTelegram } = require("../services/telegramService");
const { maskPII } = require("../utils/textSanitizer");
const { createNotification } = require("../utils/notify");

// ─── POST /api/support/report — logged-in user or guest ───────────────────────
const createTicket = asyncHandler(async (req, res) => {
  const { description, pageUrl, email, reportType, concernReason, reportedJob } = req.body;
  const isJobConcern = reportType === "job_concern";
  const validConcernReasons = [
    "Fake or scam job",
    "Incorrect information",
    "Job already closed / expired",
    "Discriminatory or inappropriate",
    "Duplicate posting",
    "Other",
  ];
  if (isJobConcern && !validConcernReasons.includes(concernReason)) {
    res.status(400);
    throw new Error("Select a valid reason for reporting this job.");
  }
  const ticketDescription = isJobConcern
    ? [
        `Job concern: ${concernReason}`,
        `Job: ${String(reportedJob?.title || "Unknown job").slice(0, 200)} at ${String(reportedJob?.company || "Unknown company").slice(0, 200)}`,
        `Job ID: ${String(reportedJob?.id || "").slice(0, 100)}`,
        `Details: ${String(req.body.details || "No additional details provided.").trim().slice(0, 1200)}`,
      ].join("\n")
    : description;

  if (!ticketDescription || ticketDescription.trim().length < 5) {
    res.status(400);
    throw new Error(
      "Please describe the issue in a bit more detail (at least 5 characters)."
    );
  }

  let userEmail = "";
  let userId = null;

  if (req.user && (req.user.id || req.user._id)) {
    userId = req.user.id || req.user._id;
    try {
      const userDoc = await User.findById(userId).select("email").lean();
      if (userDoc?.email) {
        userEmail = userDoc.email;
      }
    } catch (err) {
      console.warn("[createTicket] Could not fetch user from DB:", err.message);
    }
  }

  // Fall back to email passed in request body or default guest address
  if (!userEmail) {
    const rawEmail = typeof email === "string" ? email.trim() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (rawEmail && emailRegex.test(rawEmail)) {
      userEmail = rawEmail.toLowerCase();
    } else {
      userEmail = "guest@skillbridge.careers";
    }
  }

  let screenshotUrl = "";
  if (req.file) {
    screenshotUrl = req.file.path || req.file.secure_url || "";
  }

  const ticket = await SupportTicket.create({
    user: userId,
    email: userEmail,
    description: maskPII(ticketDescription.trim()),
    screenshotUrl,
    pageUrl: pageUrl || "",
    userAgent: req.headers["user-agent"] || "",
    reportType: isJobConcern ? "job_concern" : "general",
    concernReason: isJobConcern ? concernReason : "",
    reportedJobId: isJobConcern ? String(reportedJob?.id || "").slice(0, 100) : "",
    reportedJobTitle: isJobConcern ? String(reportedJob?.title || "").slice(0, 200) : "",
    reportedJobCompany: isJobConcern ? String(reportedJob?.company || "").slice(0, 200) : "",
  });

  // Respond immediately — do NOT await the agent
  res.status(201).json({
    message: "Thanks — your report has been submitted.",
    ticket,
  });

  // Instant notification to Telegram bot
  sendTicketAlertToTelegram(ticket, { finalStatus: "open", isHighSeverity: false })
    .then((result) => {
      if (!result.success) {
        console.error("[Telegram] Instant alert not delivered:", result.reason || result.error);
      }
    })
    .catch((err) => console.error("[Telegram] Instant alert failed:", err.message));

  // Fire-and-forget: agent runs in background after response is sent
  setImmediate(() => {
    ticketAgent.run(ticket).catch((err) =>
      console.error("[TicketAgent] Unhandled rejection:", err)
    );
  });
});

// ─── GET /api/support/my-tickets — authenticated reporter's tickets ─────────
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user.id || req.user._id })
    .select("description reportType concernReason reportedJobTitle reportedJobCompany status category resolutionMessage followUpMessages createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ tickets });
});

// ─── GET /api/support/my-tickets/:id — owner-only ticket detail ──────────────
const getMyTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findOne({
    _id: req.params.id,
    user: req.user.id || req.user._id,
  })
    .select("description reportType concernReason reportedJobId reportedJobTitle reportedJobCompany pageUrl status category severity aiSummary resolutionMessage followUpMessages screenshotUrl createdAt updatedAt")
    .lean();
  if (!ticket) {
    res.status(404);
    throw new Error("Support request not found.");
  }
  res.json({ ticket });
});

// ─── POST /api/support/my-tickets/:id/messages — add reporter details ────────
const addTicketFollowUp = asyncHandler(async (req, res) => {
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (message.length < 5 || message.length > 1200) {
    res.status(400);
    throw new Error("Please enter between 5 and 1200 characters.");
  }

  const ticket = await SupportTicket.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id || req.user._id },
    {
      $push: { followUpMessages: { message: maskPII(message), createdAt: new Date() } },
      $set: { status: "open", autoResolved: false },
    },
    { new: true },
  ).select("description reportType concernReason reportedJobTitle reportedJobCompany status resolutionMessage followUpMessages createdAt updatedAt");

  if (!ticket) {
    res.status(404);
    throw new Error("Support request not found.");
  }

  const admins = await User.find({ role: "admin" }).select("_id").lean();
  await Promise.all(admins.map((admin) => createNotification({
    recipient: admin._id,
    sender: req.user.id || req.user._id,
    type: "support_update",
    title: "User added details to a support request",
    message: `Ticket #${String(ticket._id).slice(-6).toUpperCase()}: ${maskPII(message).slice(0, 180)}`,
    priority: "high",
    actionUrl: "/admin/dashboard?tab=support",
  })));

  res.json({ ticket });
});

// ─── GET /api/support/tickets — admin only ───────────────────────────────────
const getTicketsAdmin = asyncHandler(async (req, res) => {
  const { status, severity, category } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (severity && severity !== "all") filter.severity = severity;
  if (category && category !== "all") filter.category = category;

  const tickets = await SupportTicket.find(filter)
    .populate("user", "name email role")
    .sort({ createdAt: -1 });

  res.json({ tickets });
});

// ─── PATCH /api/support/tickets/:id — admin only, update status ──────────────
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["open", "in_progress", "resolved", "closed"];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error("Invalid status value.");
  }

  const statusMessage = `Support marked your request ${status.replace("_", " ")}.`;
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status, resolutionMessage: statusMessage },
    { new: true }
  ).populate("user", "name email role");

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found.");
  }

  if (ticket.user?._id) {
    await createNotification({
      recipient: ticket.user._id,
      sender: req.user.id || req.user._id,
      type: "support_update",
      title: `Support request ${status.replace("_", " ")}`,
      message: statusMessage,
      priority: "normal",
      actionUrl: `/support/requests/${ticket._id}`,
    });
  }

  res.json({ message: "Ticket updated", ticket });
});

// ─── DELETE /api/support/tickets/:id — admin only ────────────────────────────
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found.");
  }
  res.json({ message: "Ticket deleted successfully" });
});

// ─── GET /api/support/tickets/:id/log — admin only, view agent audit log ─────
const getTicketLog = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .select("agentLog category severity aiSummary autoResolved status notifiedAt")
    .lean();

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found.");
  }

  res.json({ log: ticket.agentLog || [], meta: ticket });
});

module.exports = {
  createTicket,
  getMyTickets,
  getMyTicket,
  addTicketFollowUp,
  getTicketsAdmin,
  updateTicketStatus,
  deleteTicket,
  getTicketLog,
};
