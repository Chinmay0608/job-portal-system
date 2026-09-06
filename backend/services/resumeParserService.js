const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const logger = require("../utils/logger");
const MasterSkill = require("../models/MasterSkill");

/**
 * Extracts full profile information (phone, location, linkedin, github, about, education, experienceLevel, field, skills)
 * from resume text using Groq/Gemini AI with regex & MasterSkill fallbacks.
 */
const parseFullResumeText = async (resumeText, currentUser = {}) => {
  const extracted = {
    phone: null,
    location: null,
    linkedin: null,
    github: null,
    about: null,
    education: null,
    experienceLevel: null,
    field: null,
    skills: [],
  };

  if (!resumeText || !resumeText.trim()) return extracted;

  // 1. Regex Extraction for LinkedIn, GitHub, Phone
  const linkedinMatch = resumeText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i) ||
                        resumeText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/i);
  if (linkedinMatch) {
    extracted.linkedin = linkedinMatch[0].startsWith("http") ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  const githubMatch = resumeText.match(/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/i) ||
                      resumeText.match(/github\.com\/[a-zA-Z0-9_-]+\/?/i);
  if (githubMatch) {
    extracted.github = githubMatch[0].startsWith("http") ? githubMatch[0] : `https://${githubMatch[0]}`;
  }

  const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 10) {
    extracted.phone = phoneMatch[0].trim();
  }

  // 2. AI Intelligence (Groq / Gemini)
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const prompt = `Act as an expert HR resume parser. Extract candidate profile information from the following resume text.
Return ONLY a raw valid JSON object (with no markdown wrappers or extra text) containing these exact keys:
{
  "phone": "Candidate phone number string or null if not found",
  "location": "Candidate city, state/country string (e.g. 'Bangalore, India' or 'San Francisco, CA') or null",
  "linkedin": "LinkedIn profile URL or null",
  "github": "GitHub profile URL or null",
  "about": "A concise 2-3 sentence professional summary based on the resume or null",
  "education": "Highest degree, major, and institution or null (e.g. 'B.Tech in Computer Science')",
  "experienceLevel": "One of: 'Fresher', '0-2 Years', '2-5 Years', '5+ Years'",
  "field": "One of: 'Software Engineering', 'Data Science & Analytics', 'Product Management', 'UI/UX & Design', 'DevOps & Cloud', 'Marketing & Growth', 'Sales & BD', 'Finance & Accounting', 'HR & Operations', 'Core Engineering'",
  "skills": ["Array", "of", "technical", "and", "professional", "skills"]
}

Resume Content:
${resumeText.slice(0, 4500)}`;

  let aiJson = null;

  if (groqApiKey && groqApiKey.startsWith("gsk_")) {
    try {
      const axios = require("axios");
      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 1000,
        },
        { headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" }, timeout: 8000 }
      );
      const text = groqRes.data?.choices?.[0]?.message?.content?.trim() || "";
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        aiJson = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      }
    } catch (err) {
      logger.error("[Resume Parser] Groq full parse error:", err.message);
    }
  }

  if (!aiJson && geminiApiKey && !geminiApiKey.startsWith("AQ.")) {
    try {
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const gemRes = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
      const text = gemRes.text ? gemRes.text.trim() : "";
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        aiJson = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      }
    } catch (err) {
      logger.error("[Resume Parser] Gemini full parse error:", err.message);
    }
  }

  if (aiJson) {
    if (aiJson.phone && !extracted.phone) extracted.phone = String(aiJson.phone).trim();
    if (aiJson.location) extracted.location = String(aiJson.location).trim();
    if (aiJson.linkedin && !extracted.linkedin) extracted.linkedin = String(aiJson.linkedin).trim();
    if (aiJson.github && !extracted.github) extracted.github = String(aiJson.github).trim();
    if (aiJson.about) extracted.about = String(aiJson.about).trim();
    if (aiJson.education) extracted.education = String(aiJson.education).trim();
    if (aiJson.experienceLevel) extracted.experienceLevel = String(aiJson.experienceLevel).trim();
    if (aiJson.field) extracted.field = String(aiJson.field).trim();
    if (Array.isArray(aiJson.skills)) extracted.skills = aiJson.skills.map((s) => String(s).trim());
  }

  // 3. MasterSkills DB Fallback for Skills
  try {
    const allMasterSkills = await MasterSkill.find({});
    const existingSkillsLower = new Set(
      [...(currentUser.skills || []), ...extracted.skills].map((s) => String(s).toLowerCase())
    );

    const resumeLower = resumeText.toLowerCase();
    allMasterSkills.forEach((masterSkill) => {
      const skillName = masterSkill.name.toLowerCase();
      if (!existingSkillsLower.has(skillName)) {
        const escaped = skillName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\b${escaped}\\b`, "i").test(resumeLower)) {
          extracted.skills.push(masterSkill.name);
          existingSkillsLower.add(skillName);
        }
      }
    });
  } catch (err) {
    logger.error("[Resume Parser] MasterSkill fallback error:", err.message);
  }

  return extracted;
};

const parseFullResumeFromBuffer = async (buffer, currentUser = {}) => {
  try {
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Array);
    const data = await parser.getText();
    return await parseFullResumeText(data.text, currentUser);
  } catch (err) {
    logger.error("[Resume Parser] Buffer parse error:", err.message);
    return { phone: null, location: null, linkedin: null, github: null, about: null, education: null, experienceLevel: null, field: null, skills: [] };
  }
};

const parseFullResumeFromFile = async (filePath, currentUser = {}) => {
  if (!filePath) return { phone: null, location: null, linkedin: null, github: null, about: null, education: null, experienceLevel: null, field: null, skills: [] };
  
  try {
    if (filePath.startsWith("http")) {
      const response = await fetch(filePath);
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        return await parseFullResumeFromBuffer(arrayBuf, currentUser);
      }
    } else if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return await parseFullResumeFromBuffer(fileBuffer, currentUser);
    }
  } catch (err) {
    logger.error("[Resume Parser] File parse error:", err.message);
  }

  return { phone: null, location: null, linkedin: null, github: null, about: null, education: null, experienceLevel: null, field: null, skills: [] };
};

const extractSkillsFromResume = async (resumePath, existingUserSkills = []) => {
  const result = await parseFullResumeFromFile(resumePath, { skills: existingUserSkills });
  return result.skills || [];
};

const extractSkillsFromBuffer = async (buffer, existingUserSkills = []) => {
  const result = await parseFullResumeFromBuffer(buffer, { skills: existingUserSkills });
  return result.skills || [];
};

module.exports = {
  parseFullResumeText,
  parseFullResumeFromBuffer,
  parseFullResumeFromFile,
  extractSkillsFromResume,
  extractSkillsFromBuffer,
};
