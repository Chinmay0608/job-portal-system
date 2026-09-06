/**
 * jobMatchService.js
 * Scores jobs against a candidate's domain (field) and skill set.
 */

const FIELD_KEYWORDS = {
  "software engineering": ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "java", "python", "javascript", "web", "sde", "code", "tech", "programmer"],
  "data science & analytics": ["data", "analyst", "analytics", "scientist", "sql", "machine learning", "python", "bi", "tableau", "insights"],
  "product management": ["product manager", "product", "scrum", "agile", "roadmap", "feature", "strategy"],
  "ui/ux & design": ["design", "designer", "ui", "ux", "figma", "sketch", "visual", "creative"],
  "devops & cloud": ["devops", "cloud", "aws", "sre", "docker", "kubernetes", "infrastructure", "linux", "sysadmin"],
  "marketing & growth": ["marketing", "seo", "growth", "content", "campaign", "social media", "brand", "advertising"],
  "sales & bd": ["sales", "business development", "bd", "account", "revenue", "client", "deals"],
  "finance & accounting": ["finance", "accountant", "accounting", "audit", "tax", "banking", "financial"],
  "hr & operations": ["hr", "human resources", "recruiter", "talent", "people", "operations", "admin"],
  "core engineering": ["mechanical", "civil", "electrical", "hardware", "engineering", "cad", "site"]
};

const calculateJobMatches = (jobs, userOrSkills) => {
  let safeUserSkills = [];
  let userField = "software engineering";

  if (userOrSkills && typeof userOrSkills === "object" && !Array.isArray(userOrSkills)) {
    safeUserSkills = Array.isArray(userOrSkills.skills) ? userOrSkills.skills : [];
    userField = (userOrSkills.field || "Software Engineering").toLowerCase();
  } else if (Array.isArray(userOrSkills)) {
    safeUserSkills = userOrSkills;
  }

  const domainKeywords = FIELD_KEYWORDS[userField] || [userField.split(" ")[0]];

  return jobs
    .map((job) => {
      const jobPlain = typeof job.toObject === "function" ? job.toObject() : job;
      const titleLower = (jobPlain.title || "").toLowerCase();
      const roleLower = (jobPlain.role || "").toLowerCase();
      const descLower = (jobPlain.description || "").toLowerCase();
      const fullText = `${titleLower} ${roleLower} ${descLower}`;

      // 1. Domain Relevance Check
      const isDomainMatch = domainKeywords.some((kw) => fullText.includes(kw));

      // 2. Skill Matching (from skillsRequired array OR from full text description)
      const skillsRequired = Array.isArray(jobPlain.skillsRequired) ? jobPlain.skillsRequired : [];
      
      const matchedSkills = safeUserSkills.filter((userSkill) => {
        const uLower = userSkill.toLowerCase();
        if (skillsRequired.some((sr) => sr.toLowerCase() === uLower)) return true;
        if (fullText.includes(uLower)) return true;
        return false;
      });

      let matchPercentage = 50;

      if (isDomainMatch) {
        matchPercentage += 30; // base boost for domain match
      } else {
        matchPercentage -= 25; // penalty for non-matching domain (e.g. Marketing job for Software Engineer)
      }

      if (safeUserSkills.length > 0) {
        const skillRatio = matchedSkills.length / safeUserSkills.length;
        matchPercentage += Math.round(skillRatio * 30);
      } else if (skillsRequired.length > 0) {
        const reqRatio = matchedSkills.length / skillsRequired.length;
        matchPercentage += Math.round(reqRatio * 30);
      } else if (isDomainMatch) {
        matchPercentage += 15;
      }

      // Clamp between 30% and 98%
      const finalMatchPercentage = Math.min(98, Math.max(30, matchPercentage));

      return {
        ...jobPlain,
        matchPercentage: finalMatchPercentage,
        isDomainMatch,
        matchedSkills,
      };
    })
    .filter((job) => job.isDomainMatch || job.matchPercentage >= 70) // Exclude non-matching domain jobs
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

module.exports = {
  calculateJobMatches,
};
