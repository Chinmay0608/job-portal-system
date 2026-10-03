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

  // Bound score between 0% and 100%
  return Math.max(0, Math.min(100, Math.round(score)));
}

module.exports = {
  calculateRelevanceScore,
};
