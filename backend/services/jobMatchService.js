/**
 * jobMatchService.js
 * Scores jobs against a candidate's skill set.
 *
 * Fixes applied (audit):
 *   I-04: Guard against null userSkills and against .lean() plain objects
 *   I-16: Jobs with no requirements return matchPercentage: 100, not 0
 */

const calculateJobMatches = (jobs, userSkills) => {
  // FIX I-04: Defensively handle null/undefined — ES6 default only applies to `undefined`,
  // not to an explicit `null` passed by the caller (e.g. when user.skills is null in DB).
  const safeUserSkills = Array.isArray(userSkills) ? userSkills : [];

  return jobs
    .map((job) => {
      const skillsRequired = Array.isArray(job.skillsRequired)
        ? job.skillsRequired
        : [];

      const matchedSkills = skillsRequired.filter((skill) =>
        safeUserSkills.some(
          (userSkill) => userSkill.toLowerCase() === skill.toLowerCase(),
        ),
      );

      const noRequirements = skillsRequired.length === 0;

      // FIX I-16: Return 100% for jobs with no skill requirements instead of 0%
      // to avoid showing a misleading "0% match" badge in the UI.
      const matchPercentage = noRequirements
        ? 100
        : Math.round((matchedSkills.length / skillsRequired.length) * 100);

      // FIX I-04: Guard against .lean() plain objects — only call .toObject() if it exists
      const jobPlain = typeof job.toObject === "function" ? job.toObject() : job;

      return {
        ...jobPlain,
        matchPercentage,
        noRequirements,
      };
    })
    .filter((job) => job.matchPercentage > 0 || job.noRequirements)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

module.exports = {
  calculateJobMatches,
};
