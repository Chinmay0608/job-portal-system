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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", companySchema);
