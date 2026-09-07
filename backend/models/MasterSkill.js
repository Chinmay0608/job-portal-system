const mongoose = require("mongoose");

const masterSkillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, default: "" },
});

masterSkillSchema.index({ name: "text" });
masterSkillSchema.index({ category: 1 });

module.exports = mongoose.model("MasterSkill", masterSkillSchema);
