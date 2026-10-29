const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate",
    },
    resume: {
      type: String,
      default: "",
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    phone: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "India",
    },

    linkedin: {
      type: String,
      default: "",
    },

    github: {
      type: String,
      default: "",
    },

    portfolio: {
      type: String,
      default: "",
    },

    about: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    savedJobs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Job",
      default: [],
    },

    hiddenJobs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Job",
      default: [],
    },
    hiddenJobFeedback: [
      {
        jobId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Job",
          required: true,
        },
        reason: {
          type: String,
          enum: ["seniority", "salary", "tech_stack_mismatch", "other", "not_interested"],
          required: true,
        },
        details: {
          type: String,
          trim: true,
          maxlength: 500,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    profileImage: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },

    highestQualification: {
      type: String,
      default: "",
    },

    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    recruiterOnboardingPromptDismissed: {
      type: Boolean,
      default: false,
    },

    experienceLevel: {
      type: String,
      enum: ["Fresher", "0-2 Years", "2-5 Years", "5+ Years"],
      default: "Fresher",
    },

    field: {
      type: String,
      default: "Software Engineering",
    },

    targetSeniority: {
      type: [String],
      default: ["Entry Level", "Mid Level"],
    },

    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    emailDigestFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },

    lastJobDigestSentAt: {
      type: Date,
      default: null,
    },

    /* ==========================
       RECRUITER-ONLY FIELDS
       Populated only when role === "recruiter"
    ========================== */
    designation: {
      type: String,
      default: "",
    },

    companyName: {
      type: String,
      default: "",
    },

    companyWebsite: {
      type: String,
      default: "",
    },
    companyLogo: {
      type: String,
      default: "",
    },
    companyIndustry: {
      type: String,
      enum: ["", "Software / SaaS", "FinTech", "EdTech", "Healthcare", "E-Commerce", "Other"],
      default: "",
    },
    companySize: {
      type: String,
      enum: ["", "1-10", "11-50", "51-200", "201-500", "500+"],
      default: "",
    },
    companyHeadquarters: {
      type: String,
      default: "",
    },
    companySocials: {
      type: new mongoose.Schema({
        linkedin: { type: String, default: "" },
        twitter: { type: String, default: "" },
        github: { type: String, default: "" },
      }, { _id: false }),
      default: () => ({}),
    },
    timeZone: {
      type: String,
      default: "Asia/Kolkata",
    },
    schedulingLink: {
      type: String,
      default: "",
    },
    emailSignature: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    contactVisibility: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    jobPreferences: {
      externalOnly: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
