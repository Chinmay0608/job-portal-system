/**
 * jobMatchService.js
 * Hybrid semantic vector matching & reranking engine for jobs.
 */

const { getEmbedding, cosineSimilarity } = require('./embeddingService');

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

/**
 * Calculates a hybrid semantic match score (0-100%) between candidate profile and a job posting.
 * Incorporates hard constraints (40%) and semantic embedding alignment (60%).
 * 
 * @param {Object} candidate 
 * @param {Object} job 
 * @returns {Promise<{ score: number, matchType: string, details: Object }>}
 */
const calculateSemanticMatchScore = async (candidate = {}, job = {}) => {
  const jobPlain = typeof job.toObject === "function" ? job.toObject() : job;
  const skillsRequired = Array.isArray(jobPlain.skillsRequired) ? jobPlain.skillsRequired : [];

  // Guard: Zero required skills default neutral score
  if (skillsRequired.length === 0 && !jobPlain.title) {
    return {
      score: 70,
      matchType: "Open Match",
      details: { baseScore: 40, semanticScore: 30 }
    };
  }

  // 1. Base Match (Hard Constraints - 40%)
  let baseScore = 0;
  
  // Experience Alignment (Up to 20%)
  const userExp = (candidate.experienceLevel || candidate.experience || "").toLowerCase();
  const jobExp = (jobPlain.experienceLevel || jobPlain.experienceRequired || "").toLowerCase();

  if (!jobExp || !userExp || jobExp === "fresher" || jobExp.includes("entry") || userExp.includes(jobExp) || jobExp.includes(userExp)) {
    baseScore += 20;
  } else {
    baseScore += 10; // Partial credit
  }

  // Location / Work-mode Alignment (Up to 20%)
  const userLoc = (candidate.location || candidate.preferredLocation || "").toLowerCase();
  const jobLoc = (jobPlain.location || "").toLowerCase();
  const isRemoteJob = jobPlain.isRemote || jobLoc.includes("remote");

  if (isRemoteJob || !jobLoc || userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) {
    baseScore += 20;
  } else {
    baseScore += 10;
  }

  // 2. Semantic Skill & Context Alignment (60%)
  const candidateSkillsText = Array.isArray(candidate.skills) ? candidate.skills.join(', ') : (candidate.skills || '');
  const candidateText = `${candidate.headline || candidate.role || ''} skills: ${candidateSkillsText}`.trim();
  const jobSkillsText = skillsRequired.join(', ');
  const jobText = `${jobPlain.title || ''} skills: ${jobSkillsText} ${(jobPlain.description || '').slice(0, 200)}`.trim();

  let semanticScore = 0;
  let similarity = 0;

  if (skillsRequired.length === 0 && !jobPlain.description) {
    // Zero skills required fallback to Open Match neutral score
    semanticScore = 30; // 50% of 60
    similarity = 0.5;
  } else {
    const vecCandidate = await getEmbedding(candidateText);
    const vecJob = await getEmbedding(jobText);
    similarity = cosineSimilarity(vecCandidate, vecJob);
    const clampedSim = Math.max(0, Math.min(1, similarity));
    semanticScore = Math.round(clampedSim * 60);
  }

  const totalScore = Math.min(100, Math.max(0, baseScore + semanticScore));
  const matchType = skillsRequired.length === 0 ? "Open Match" : (totalScore >= 80 ? "Strong Match" : totalScore >= 60 ? "Good Match" : "Potential Match");

  return {
    score: totalScore,
    matchType,
    details: {
      baseScore,
      semanticScore,
      similarityScore: Number(similarity.toFixed(4))
    }
  };
};

/**
 * Helper to check skill match (Exact + Regex + Cosine Similarity)
 */
const evaluateSkillMatch = async (candidateSkill, candidateEmbedding, skillsRequired, fullText, requiredEmbeddingsMap) => {
  const uLower = candidateSkill.toLowerCase();

  // 1. Exact match check against required skills
  if (skillsRequired.some((sr) => sr.toLowerCase() === uLower)) {
    return { isMatch: true, score: 1.0 };
  }

  // 2. Regex word boundary check in job full text
  const escaped = uLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${escaped}\\b`, "i").test(fullText)) {
    return { isMatch: true, score: 1.0 };
  }

  // 3. Semantic similarity check against required skills (threshold >= 0.82)
  if (candidateEmbedding && skillsRequired.length > 0) {
    let maxSim = 0;
    for (const reqSkill of skillsRequired) {
      let reqVec = requiredEmbeddingsMap.get(reqSkill);
      if (!reqVec) {
        reqVec = await getEmbedding(reqSkill);
        requiredEmbeddingsMap.set(reqSkill, reqVec);
      }
      const sim = cosineSimilarity(candidateEmbedding, reqVec);
      if (sim > maxSim) {
        maxSim = sim;
      }
    }

    if (maxSim >= 0.82) {
      return { isMatch: true, score: maxSim };
    }
  }

  return { isMatch: false, score: 0 };
};

/**
 * Batch calculation of job matches for a user or candidate profile.
 */
const calculateJobMatches = async (jobs, userOrSkills, isExplicitSearch = false) => {
  let safeUserSkills = [];
  let userField = "software engineering";

  if (userOrSkills && typeof userOrSkills === "object" && !Array.isArray(userOrSkills)) {
    safeUserSkills = Array.isArray(userOrSkills.skills) ? userOrSkills.skills : [];
    userField = (userOrSkills.field || "Software Engineering").toLowerCase();
  } else if (Array.isArray(userOrSkills)) {
    safeUserSkills = userOrSkills;
  }

  const domainKeywords = FIELD_KEYWORDS[userField] || [userField.split(" ")[0]];

  // Precompute candidate skill embeddings for fast semantic comparison
  const candidateSkillEmbeddings = await Promise.all(
    safeUserSkills.map(async (skill) => ({
      skill,
      embedding: await getEmbedding(skill)
    }))
  );

  const requiredEmbeddingsMap = new Map();

  const processedJobs = await Promise.all(
    jobs.map(async (job) => {
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

      // 2. Skill Matching (Semantic + Exact)
      const skillsRequired = Array.isArray(jobPlain.skillsRequired) ? jobPlain.skillsRequired : [];
      
      const matchedSkills = [];
      let totalSkillScore = 0;

      for (const item of candidateSkillEmbeddings) {
        const matchResult = await evaluateSkillMatch(
          item.skill,
          item.embedding,
          skillsRequired,
          fullText,
          requiredEmbeddingsMap
        );
        if (matchResult.isMatch) {
          matchedSkills.push(item.skill);
          totalSkillScore += matchResult.score;
        }
      }

      let matchPercentage = 50;

      if (isDomainMatch) {
        matchPercentage += 30; // base boost for domain match
      } else {
        matchPercentage -= 35; // penalty for non-matching domain
      }

      if (safeUserSkills.length > 0) {
        const skillRatio = totalSkillScore / safeUserSkills.length;
        matchPercentage += Math.round(skillRatio * 20);
      } else if (skillsRequired.length > 0) {
        const reqRatio = totalSkillScore / skillsRequired.length;
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
  );

  return processedJobs
    .filter((job) => isExplicitSearch || job.isDomainMatch)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

module.exports = {
  calculateJobMatches,
  calculateSemanticMatchScore,
  FIELD_KEYWORDS,
};
