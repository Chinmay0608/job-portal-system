const mongoose = require("mongoose");

const masterSkillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
});

masterSkillSchema.index({ name: "text" });

module.exports = mongoose.model("MasterSkill", masterSkillSchema);