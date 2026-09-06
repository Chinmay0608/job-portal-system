/**
 * jobMatchService.js
 * Scores jobs against a candidate's domain (field) and skill set.
 */

const FIELD_KEYWORDS = {
  "software engineering": ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "java", "python", "javascript", "sde", "programmer", "coder", "software engineer", "web developer"],
  "data science & analytics": ["data scientist", "data analyst", "analytics", "data science", "machine learning", "tableau", "power bi", "deep learning", "sql analyst"],
  "product management": ["product manager", "product management", "scrum master", "product owner", "agile coach"],
  "ui/ux & design": ["ui/ux", "ux designer", "ui designer", "graphic designer", "figma", "visual designer", "product designer"],
  "devops & cloud": ["devops", "cloud engineer", "sre", "kubernetes", "docker", "aws", "sysadmin", "infrastructure engineer"],
  "marketing & growth": ["marketing", "growth hacker", "seo", "content writer", "social media", "digital marketing", "brand manager", "mba"],
  "sales & bd": ["sales", "business development", "account executive", "sales manager", "bde", "sales representative"],
  "finance & accounting": ["finance", "accountant", "accounting", "auditor", "financial analyst", "tax consultant"],
  "hr & operations": ["hr", "human resources", "recruiter", "talent acquisition", "people operations", "operations manager"],
  "core engineering": ["mechanical engineer", "civil engineer", "electrical engineer", "hardware engineer", "cad designer"]
};

const calculateJobMatches = (jobs, userOrSkills, isExplicitSearch = false) => {
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

      // 1. Domain Relevance Check using word boundaries \b
      const isDomainMatch = domainKeywords.some((kw) => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "i");
        return regex.test(fullText);
      });

      // 2. Skill Matching
      const skillsRequired = Array.isArray(jobPlain.skillsRequired) ? jobPlain.skillsRequired : [];
      
      const matchedSkills = safeUserSkills.filter((userSkill) => {
        const uLower = userSkill.toLowerCase();
        if (skillsRequired.some((sr) => sr.toLowerCase() === uLower)) return true;
        const escaped = uLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`\\b${escaped}\\b`, "i").test(fullText);
      });

      let matchPercentage = 50;

      if (isDomainMatch) {
        matchPercentage += 30; // base boost for domain match
      } else {
        matchPercentage -= 35; // penalty for non-matching domain
      }

      if (safeUserSkills.length > 0) {
        const skillRatio = matchedSkills.length / safeUserSkills.length;
        matchPercentage += Math.round(skillRatio * 20);
      } else if (skillsRequired.length > 0) {
        const reqRatio = matchedSkills.length / skillsRequired.length;
        matchPercentage += Math.round(reqRatio * 20);
      } else if (isDomainMatch) {
        matchPercentage += 15;
      }

      const finalMatchPercentage = isDomainMatch 
        ? Math.min(98, Math.max(50, matchPercentage))
        : Math.max(20, matchPercentage);

      return {
        ...jobPlain,
        matchPercentage: finalMatchPercentage,
        isDomainMatch,
        matchedSkills,
      };
    })
    .filter((job) => isExplicitSearch || job.isDomainMatch) // Only include matching domain jobs when browsing!
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

module.exports = {
  calculateJobMatches,
};
