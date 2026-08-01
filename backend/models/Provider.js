const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g., 'ADZUNA'
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    apiKey: {
      type: String,
      default: "",
    },
    apiSecret: {
      type: String,
      default: "",
    },
    baseUrl: {
      type: String,
      default: "",
    },
    syncIntervalHours: {
      type: Number,
      default: 6,
    },
    priority: {
      type: Number,
      default: 1,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    lastStatus: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "PENDING",
    },
    lastError: {
      type: String,
      default: "",
    },
    totalJobsFetched: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Provider", providerSchema);
