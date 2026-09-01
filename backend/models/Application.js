const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    resume: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "rejected", "applied_externally", "selected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

// Ensure a candidate can only apply once to a specific job
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
