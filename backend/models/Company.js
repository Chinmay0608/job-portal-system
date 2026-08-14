const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    website: {
      type: String,
      default: "",
    },
    normalizedDomain: {
      type: String,
      unique: true,
      sparse: true, 
    },
    careerPage: {
      type: String,
      default: "",
    },
    industry: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
    // --- SDE Phase B Extensions ---
    platformRef: {
      type: String,
      default: "UNKNOWN",
    },
    status: {
      type: String,
      enum: ['DISCOVERED', 'VERIFIED', 'ACTIVE', 'STALE', 'DORMANT', 'ARCHIVED', 'FAILED_VALIDATION'],
      default: 'DISCOVERED',
    },
    priority: {
      type: Number,
      default: 5,
    },
    verificationLevel: {
      type: String,
      enum: ['ATS Verified', 'Website Verified', 'User Submitted', 'Seed Database', 'Unknown'],
      default: 'Unknown'
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", companySchema);
