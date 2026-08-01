const mongoose = require("mongoose");

const CompanyRegistryMetadataSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true,
    },
    lastSuccessfulDiscovery: {
      type: Date,
    },
    lastSuccessfulCrawl: {
      type: Date,
    },
    lastPlatformDetection: {
      type: Date,
    },
    lastMigration: {
      type: Date,
    },
    averageJobsFound: {
      type: Number,
      default: 0,
    },
    crawlDurationMs: {
      type: Number,
      default: 0, // Moving average
    },
    consecutiveEmptyCrawls: {
      type: Number,
      default: 0,
    },
    // --- STAGE 1.5 REVISIONS ---
    latestCrawlDeltas: {
      newJobs: { type: Number, default: 0 },
      updatedJobs: { type: Number, default: 0 },
      expiredJobs: { type: Number, default: 0 },
      unchangedJobs: { type: Number, default: 0 },
      failedJobs: { type: Number, default: 0 }
    },
    freshnessMetrics: {
      fresh24h: { type: Number, default: 0 },
      recent1to7d: { type: Number, default: 0 },
      aging7to30d: { type: Number, default: 0 },
      staleOver30d: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CompanyRegistryMetadata", CompanyRegistryMetadataSchema);
