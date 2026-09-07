const mongoose = require("mongoose");

const aiUsageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
      default: "anonymous@candidate.com",
    },
    userName: {
      type: String,
      default: "Candidate",
    },
    feature: {
      type: String,
      enum: ["AI_CAREER_COACH", "RESUME_PARSER", "JOB_MATCH_ANALYZER"],
      default: "AI_CAREER_COACH",
    },
    model: {
      type: String,
      default: "gemini-2.5-flash",
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    estimatedCostUsd: {
      type: Number,
      default: 0,
    },
    responseTimeMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "QUOTA_EXCEEDED"],
      default: "SUCCESS",
    },
  },
  {
    timestamps: true,
  }
);

aiUsageLogSchema.index({ createdAt: -1 });
aiUsageLogSchema.index({ userEmail: 1 });

module.exports = mongoose.model("AiUsageLog", aiUsageLogSchema);
