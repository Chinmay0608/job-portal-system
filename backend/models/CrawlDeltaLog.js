const mongoose = require("mongoose");

const CrawlDeltaLogSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true
    },
    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },
    expiredJobs: { type: Number, default: 0 },
    unchangedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CrawlDeltaLog", CrawlDeltaLogSchema);
