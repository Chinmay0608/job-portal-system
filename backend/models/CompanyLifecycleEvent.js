const mongoose = require("mongoose");

const CompanyLifecycleEventSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    previousState: {
      type: String,
    },
    newState: {
      type: String,
      required: true,
    },
    reason: {
      type: String, // e.g., "4 consecutive empty crawls", "Platform migration detected"
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: false, // We only need the explicit timestamp above
  }
);

// Index for chronological querying of a company's timeline
CompanyLifecycleEventSchema.index({ companyId: 1, timestamp: -1 });

module.exports = mongoose.model("CompanyLifecycleEvent", CompanyLifecycleEventSchema);
