const fs = require('fs');

const path = 'D:/MERN Project/job-portal/backend/controllers/jobController.js';
let content = fs.readFileSync(path, 'utf8');

const helper = `
// Helper to build active jobs query dynamically (compensates for sleeping cron jobs on free tiers)
const getBaseActiveJobQuery = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return {
    isActive: { $ne: false },
    $and: [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      },
      {
        $or: [
          { isExternal: true, createdAt: { $gte: thirtyDaysAgo } },
          { isExternal: { $ne: true }, updatedAt: { $gte: ninetyDaysAgo } }
        ]
      }
    ]
  };
};
`;

if (!content.includes('getBaseActiveJobQuery')) {
  // Insert right before GET ALL JOBS
  content = content.replace(
    /\/\* ==========================\n   GET ALL JOBS\n========================== \*\//,
    helper + '\n/* ==========================\n   GET ALL JOBS\n========================== */'
  );
}

// Replace the static query in getAllJobs
const getAllJobsOriginalQuery = `  const query = { 
    isActive: { $ne: false },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };`;

if (content.includes(getAllJobsOriginalQuery)) {
  content = content.replace(getAllJobsOriginalQuery, '  const query = getBaseActiveJobQuery();');
}

// Replace the static query in getRecommendedJobs
const getRecommendedJobsOriginalQuery = `  // Show all active jobs (both internal and external)
  let query = { isActive: { $ne: false } };`;

if (content.includes(getRecommendedJobsOriginalQuery)) {
  content = content.replace(getRecommendedJobsOriginalQuery, '  // Show all active jobs (both internal and external)\n  let query = getBaseActiveJobQuery();');
}

fs.writeFileSync(path, content);
console.log('jobController.js patched successfully!');
