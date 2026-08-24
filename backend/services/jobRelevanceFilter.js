// Keywords that indicate a job is relevant to this platform's audience.
// A job passes if its title OR skillsRequired contains at least one of these.
// NOTE: Chinmay, these RELEVANT_KEYWORDS and EXCLUDED_TITLE_TERMS are a starting point. 
// Please review and adjust them based on your actual MasterSkill data and target roles!
const RELEVANT_KEYWORDS = [
  "software", "developer", "engineer", "full stack", "fullstack",
  "frontend", "front-end", "backend", "back-end", "mern", "mean",
  "react", "node", "javascript", "java", "spring", "spring boot",
  "python", "web developer", "sde", "sde1", "sde-1", "sde 1",
];

// Titles containing these terms are excluded even if they match a keyword
// above, since they're not realistic targets for this platform's audience
// (adjust or remove this list entirely if senior roles should be shown too).
const EXCLUDED_TITLE_TERMS = [
  "director", "vp ", "vice president", "chief", "principal engineer",
  "staff engineer", "head of", "10+ years", "15+ years"
];

const isJobRelevant = (job) => {
  const titleLower = (job.title || "").toLowerCase();
  const skillsText = Array.isArray(job.skillsRequired)
    ? job.skillsRequired.join(" ").toLowerCase()
    : "";
  const combined = titleLower + " " + skillsText;

  const hasExcludedTerm = EXCLUDED_TITLE_TERMS.some((term) =>
    titleLower.includes(term),
  );
  if (hasExcludedTerm) return false;

  const hasRelevantKeyword = RELEVANT_KEYWORDS.some((keyword) =>
    combined.includes(keyword),
  );
  return hasRelevantKeyword;
};

module.exports = { isJobRelevant, RELEVANT_KEYWORDS, EXCLUDED_TITLE_TERMS };
