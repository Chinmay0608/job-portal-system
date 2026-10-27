const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  reason: { type: String, required: true, maxlength: 1000 },
  privacyRequest: { type: String, default: "", maxlength: 1000 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  otpHash: { type: String, select: false },
  otpExpires: Date,
}, { timestamps: true });

module.exports = mongoose.models.AccountDeletionRequest || mongoose.model("AccountDeletionRequest", schema);
