/**
 * relevanceEngine.js
 * Node.js port of gcc-job-radar relevance scoring engine (relevance.py).
 * Calculates 0-100 bounded match scores for any job against candidate profile & preferences.
 */

function calculateRelevanceScore(job, user) {
  if (!job || !user) return 50;

  let score = 50; // Neutral base score

  const jobTitle = (job.title || "").toLowerCase();
  const jobDesc = (job.description || "").toLowerCase();
  const userDomain = (user.field || user.targetDomain || "").toLowerCase();
  const userSkills = (user.skills || []).map((s) => s.toLowerCase());
  const userSeniorities = (
    user.targetSeniority || ["Entry Level", "Mid Level"]
  ).map((s) => s.toLowerCase());

  // 1. Domain Match (+20 points)
  const jobDomain = (job.domain || "").toLowerCase();
  if (
    userDomain &&
    (jobDomain.includes(userDomain) || userDomain.includes(jobDomain))
  ) {
    score += 20;
  }

  // 2. Seniority Match (+20 points / -20 penalty)
  const jobSeniority = (
    job.seniorityLevel ||
    job.experienceRequired ||
    ""
  ).toLowerCase();
  const matchesSeniority = userSeniorities.some(
    (s) => jobSeniority.includes(s) || s.includes(jobSeniority)
  );
  if (matchesSeniority) {
    score += 20;
  } else {
    // Penalty for mismatched level
    score -= 20;
  }

  // 3. Technical & Professional Skill Match (+8 points per matched skill up to +30 max)
  let matchedSkillCount = 0;
  for (const skill of userSkills) {
    if (
      skill.length > 1 &&
      (jobTitle.includes(skill) || jobDesc.includes(skill))
    ) {
      matchedSkillCount++;
    }
  }
  score += Math.min(30, matchedSkillCount * 8);

  // 4. Remote Match Bonus (+5 points)
  if (job.isRemote) {
    score += 5;
  }

  // Personalize ranking using recent reasons the candidate hid similar jobs.
  const feedback = (user.hiddenJobFeedback || []).slice(-30).reverse();
  let feedbackPenalty = 0;
  for (const [index, entry] of feedback.entries()) {
    const disliked = entry.jobId && typeof entry.jobId === "object" ? entry.jobId : null;
    if (!disliked) continue;

    const decay = Math.max(0.35, 1 - index * 0.04);
    let penalty = 0;
    const reason = entry.reason;

    if (reason === "seniority") {
      const dislikedLevel = (disliked.seniorityLevel || disliked.experienceRequired || "").toLowerCase();
      const candidateLevel = (job.seniorityLevel || job.experienceRequired || "").toLowerCase();
      if (dislikedLevel && dislikedLevel !== "not specified" && candidateLevel === dislikedLevel) penalty = 16;
    } else if (reason === "salary") {
      const dislikedSalary = Number(disliked.salaryMin || disliked.salaryMax || 0);
      const candidateSalary = Number(job.salaryMin || job.salaryMax || 0);
      const sameCurrency = (disliked.salaryCurrency || "").toLowerCase() === (job.salaryCurrency || "").toLowerCase();
      if (dislikedSalary > 0 && candidateSalary > 0 && sameCurrency && Math.abs(candidateSalary - dislikedSalary) / dislikedSalary <= 0.3) penalty = 12;
    } else if (reason === "tech_stack_mismatch") {
      const dislikedSkills = (disliked.skillsRequired || []).map((skill) => skill.toLowerCase());
      const candidateSkills = (job.skillsRequired || []).map((skill) => skill.toLowerCase());
      const overlap = dislikedSkills.filter((skill) => candidateSkills.includes(skill)).length;
      if (dislikedSkills.length && candidateSkills.length) penalty = 18 * (overlap / Math.max(dislikedSkills.length, candidateSkills.length));
    } else {
      const dislikedDomain = (disliked.domain || disliked.role || "").toLowerCase();
      const candidateDomain = (job.domain || job.role || "").toLowerCase();
      const titleTokens = (title) => new Set(title.toLowerCase().split(/[^a-z0-9+#.]+/).filter((token) => token.length > 2));
      const dislikedTitle = titleTokens(disliked.title || "");
      const candidateTitle = titleTokens(job.title || "");
      const sharedTitleWords = [...dislikedTitle].filter((token) => candidateTitle.has(token)).length;
      const titleSimilarity = sharedTitleWords / Math.max(dislikedTitle.size, candidateTitle.size, 1);
      const dislikedSkills = (disliked.skillsRequired || []).map((skill) => skill.toLowerCase());
      const candidateSkills = (job.skillsRequired || []).map((skill) => skill.toLowerCase());
      const sharedSkills = dislikedSkills.filter((skill) => candidateSkills.includes(skill)).length;
      const skillSimilarity = sharedSkills / Math.max(dislikedSkills.length, candidateSkills.length, 1);
      if (dislikedDomain && candidateDomain && (dislikedDomain.includes(candidateDomain) || candidateDomain.includes(dislikedDomain))) penalty += 8;
      penalty += titleSimilarity * 12 + skillSimilarity * 10;
    }

    feedbackPenalty += penalty * decay;
    if (feedbackPenalty >= 35) break;
  }
  score -= Math.min(35, feedbackPenalty);

  // Bound score between 0% and 100%
  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = {
  calculateRelevanceScore,
};
