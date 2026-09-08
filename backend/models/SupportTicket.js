const mongoose = require("mongoose");

const agentLogEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    detail: { type: String, default: "" },
    ts: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    screenshotUrl: { type: String, default: "" },
    pageUrl: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // Lifecycle status — "closed" added for spam/auto-dismissed tickets
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },

    // AI triage fields
    category: {
      type: String,
      enum: [
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
      ],
      default: "other",
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
      index: true,
    },
    aiSummary: { type: String, default: "" },

    // Agent execution audit trail
    agentLog: { type: [agentLogEntrySchema], default: [] },

    // Resolution metadata
    autoResolved: { type: Boolean, default: false },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
