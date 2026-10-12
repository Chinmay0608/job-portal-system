const mongoose = require("mongoose");

const aiFeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: String,
      enum: ["positive", "negative"],
      required: true,
    },
    feedbackReason: {
      type: String,
      enum: ["inaccurate", "irrelevant", "unclear", "too_detailed", "other"],
      default: null,
    },
    candidateSkills: {
      type: [String],
      default: [],
    },
    candidateField: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index for fast export queries (positive ratings only)
aiFeedbackSchema.index({ rating: 1, createdAt: -1 });

module.exports = mongoose.model("AiFeedback", aiFeedbackSchema);
