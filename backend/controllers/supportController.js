"use strict";

const asyncHandler = require("express-async-handler");
const SupportTicket = require("../models/SupportTicket");
const User = require("../models/user");
const ticketAgent = require("../services/ticketAgent");

// ─── POST /api/support/report — any logged-in user ───────────────────────────
const createTicket = asyncHandler(async (req, res) => {
  const { description, pageUrl } = req.body;

  if (!description || description.trim().length < 5) {
    res.status(400);
    throw new Error(
      "Please describe the issue in a bit more detail (at least 5 characters)."
    );
  }

  // JWT only carries { id, role } — fetch email from DB (lean, minimal select)
  const userDoc = await User.findById(req.user.id).select("email").lean();
  const userEmail = userDoc?.email;
  if (!userEmail) {
    res.status(401);
    throw new Error("Unable to determine your email address. Please log in again.");
  }

  let screenshotUrl = "";
  if (req.file) {
    screenshotUrl = req.file.path || req.file.secure_url || "";
  }

  const ticket = await SupportTicket.create({
    user: req.user.id || req.user._id,
    email: userEmail,
    description: description.trim(),
    screenshotUrl,
    pageUrl: pageUrl || "",
    userAgent: req.headers["user-agent"] || "",
  });

  // Respond immediately — do NOT await the agent
  res.status(201).json({
    message: "Thanks — your report has been submitted.",
    ticket,
  });

  // Fire-and-forget: agent runs in background after response is sent
  setImmediate(() => {
    ticketAgent.run(ticket).catch((err) =>
      console.error("[TicketAgent] Unhandled rejection:", err)
    );
  });
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

  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("user", "name email role");

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found.");
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
  getTicketsAdmin,
  updateTicketStatus,
  deleteTicket,
  getTicketLog,
};
