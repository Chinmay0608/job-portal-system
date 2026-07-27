const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const logger = require("../utils/logger");
const MasterSkill = require("../models/MasterSkill");

const extractSkillsFromResume = async (resumePath, existingUserSkills = []) => {
  let newlyExtractedSkills = [];
  
  if (!resumePath || !resumePath.toLowerCase().endsWith(".pdf")) {
    return newlyExtractedSkills;
  }

  try {
    logger.info("[Resume Parser] Parsing PDF for skills...");
    const fileBuffer = fs.readFileSync(resumePath);
    const uint8Array = new Uint8Array(fileBuffer);
    const parser = new PDFParse(uint8Array);
    const data = await parser.getText();
    const resumeText = data.text.toLowerCase();

    const allMasterSkills = await MasterSkill.find({});
    const existingSkillsLower = existingUserSkills.map((s) => s.toLowerCase());

    allMasterSkills.forEach((masterSkill) => {
      const skillName = masterSkill.name.toLowerCase();

      if (!existingSkillsLower.includes(skillName)) {
        const escapedSkill = skillName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const regex = new RegExp(`\\b${escapedSkill}\\b`, "i");

        if (regex.test(resumeText)) {
          newlyExtractedSkills.push(masterSkill.name);
        }
      }
    });

    if (newlyExtractedSkills.length > 0) {
      logger.info(
        "[Resume Parser] Extracted new skills",
        newlyExtractedSkills,
      );
    }
  } catch (parseError) {
    logger.error(parseError, "[Resume Parser] Failed to parse resume");
  }

  return newlyExtractedSkills;
};

const extractSkillsFromBuffer = async (buffer, existingUserSkills = []) => {
  let newlyExtractedSkills = [];
  
  try {
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Array);
    const data = await parser.getText();
    const resumeText = data.text.toLowerCase();

    const allMasterSkills = await MasterSkill.find({});
    const existingSkillsLower = existingUserSkills.map((s) => s.toLowerCase());

    allMasterSkills.forEach((masterSkill) => {
      const skillName = masterSkill.name.toLowerCase();

      if (!existingSkillsLower.includes(skillName)) {
        const escapedSkill = skillName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const regex = new RegExp(`\\b${escapedSkill}\\b`, "i");

        if (regex.test(resumeText)) {
          newlyExtractedSkills.push(masterSkill.name);
        }
      }
    });
  } catch (parseError) {
    logger.error(parseError, "[Resume Parser] Failed to parse resume buffer");
  }
  
  return newlyExtractedSkills;
};

module.exports = {
  extractSkillsFromResume,
  extractSkillsFromBuffer,
};
