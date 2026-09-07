const asyncHandler = require("express-async-handler");
const SupportTicket = require("../models/SupportTicket");

// POST /api/support/report — any logged-in user
const createTicket = asyncHandler(async (req, res) => {
  const { description, pageUrl } = req.body;

  if (!description || description.trim().length < 5) {
    res.status(400);
    throw new Error("Please describe the issue in a bit more detail (at least 5 characters).");
  }

  let screenshotUrl = "";
  if (req.file) {
    screenshotUrl = req.file.path || req.file.secure_url || "";
  }

  const ticket = await SupportTicket.create({
    user: req.user.id,
    description: description.trim(),
    screenshotUrl,
    pageUrl: pageUrl || "",
    userAgent: req.headers["user-agent"] || "",
  });

  res.status(201).json({ message: "Thanks — your report has been submitted.", ticket });
});

// GET /api/support/tickets — admin only
const getTicketsAdmin = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && status !== "all") filter.status = status;

  const tickets = await SupportTicket.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({ tickets });
});

// PATCH /api/support/tickets/:id — admin only, update status
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["open", "in_progress", "resolved"];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }

  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  res.json({ message: "Ticket updated", ticket });
});

module.exports = { createTicket, getTicketsAdmin, updateTicketStatus };
