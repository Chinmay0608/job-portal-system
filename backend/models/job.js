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
},
{
  timestamps: true,
}
);

module.exports = mongoose.model("Job", jobSchema);