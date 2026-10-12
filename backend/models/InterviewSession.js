const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  category: {
    type: String,
    enum: ["technical", "behavioral", "situational"],
    default: "technical",
  },
  candidateAnswer: { type: String, default: "" },
  aiScore: { type: Number, min: 0, max: 100, default: 0 },
  aiFeedback: {
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    suggestedAnswer: { type: String, default: "" },
  },
  answeredAt: { type: Date },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    jobTitle: { type: String, default: "" },
    company: { type: String, default: "" },
    jobLocation: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    jobDomain: { type: String, required: true, default: "Software Engineering" },
    targetSeniority: { type: String, required: true, default: "Entry Level" },
    interviewType: {
      type: String,
      enum: ["technical", "behavioral", "mixed"],
      default: "mixed",
    },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
