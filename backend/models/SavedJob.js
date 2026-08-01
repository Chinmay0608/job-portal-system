const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
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
    }
  },
  {
    timestamps: true,
  }
);

// Ensure a candidate can only save a specific job once
savedJobSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("SavedJob", savedJobSchema);
