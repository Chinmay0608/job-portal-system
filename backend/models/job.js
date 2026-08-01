const mongoose = require("mongoose");
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      type: String,
      required: true,
    },
    applyUrl: {
      type: String,
      default: "",
    },
    isExternal: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    skillsRequired: {
      type: [String],
      default: [],
    },

    educationRequired: {
      type: String,
      default: "",
    },

    experienceRequired: {
      type: String,
      enum: ["Fresher", "0-2 Years", "2-5 Years", "5+ Years"],
      default: "Fresher",
    },

    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.isExternal;
      },
    },

    // --- Career OS / Aggregation Fields (Non-Breaking) ---
    source: { type: String, default: 'INTERNAL' }, 
    externalId: { type: String, default: null }, // Maps to Provider's job ID
    expiresAt: { type: Date, default: null }, // For TTL auto-cleanup
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    employmentType: { type: String, default: "" },
    keywords: [{ type: String, default: [] }],
    providerMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  },
);

// Add Indexes for performance
jobSchema.index({ isActive: 1, isExternal: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ title: "text", company: "text" });

module.exports = mongoose.model("Job", jobSchema);
