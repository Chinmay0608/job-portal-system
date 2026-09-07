const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    screenshotUrl: { type: String, default: "" },
    pageUrl: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
