/**
 * Job Relevance Filter
 * Open to ALL domains (Software, Product, Design, Sales, Marketing, HR, Finance, Data, Operations, Management, etc.)
 */
const RELEVANT_KEYWORDS = [];
const EXCLUDED_TITLE_TERMS = [];

const isJobRelevant = (job) => {
  // Allow all jobs across all domains
  return true;
};

module.exports = { isJobRelevant, RELEVANT_KEYWORDS, EXCLUDED_TITLE_TERMS };
