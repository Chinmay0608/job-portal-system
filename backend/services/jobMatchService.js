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

      const matchPercentage =
        skillsRequired.length > 0
          ? Math.round((matchedSkills.length / skillsRequired.length) * 100)
          : 0;

      return {
        ...job.toObject(),
        matchPercentage,
      };
    })
    .filter((job) => job.matchPercentage > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

module.exports = {
  calculateJobMatches,
};
