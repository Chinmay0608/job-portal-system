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
      enum: ["candidate", "recruiter"],
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

    linkedin: {
      type: String,
      default: "",
    },

    github: {
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

    profileImage: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },

    experienceLevel: {
      type: String,
      enum: ["Fresher", "0-2 Years", "2-5 Years", "5+ Years"],
      default: "Fresher",
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

module.exports = mongoose.model("User", userSchema);
