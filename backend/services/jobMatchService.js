const calculateJobMatches = (jobs, userSkills = []) => {
  return jobs
    .map((job) => {
      const skillsRequired = Array.isArray(job.skillsRequired)
        ? job.skillsRequired
        : [];

      const matchedSkills = skillsRequired.filter((skill) =>
        userSkills.some(
          (userSkill) => userSkill.toLowerCase() === skill.toLowerCase(),
        ),
      );

      const noRequirements = skillsRequired.length === 0;
      const matchPercentage = noRequirements
          ? 0
          : Math.round((matchedSkills.length / skillsRequired.length) * 100);

      return {
        ...job.toObject(),
        matchPercentage,
        noRequirements
      };
    })
    .filter((job) => job.matchPercentage > 0 || job.noRequirements)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

module.exports = {
  calculateJobMatches,
};
