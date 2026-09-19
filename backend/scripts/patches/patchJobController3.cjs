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
  // Just find `const getAllJobs = ` and inject before it
  content = content.replace(
    /const getAllJobs = asyncHandler/g,
    helper + '\nconst getAllJobs = asyncHandler'
  );
}

// Just find the query blocks and replace them. Use regex to handle CRLF and spacing.
content = content.replace(
  /const query = \{\s*isActive: \{ \$ne: false \},\s*\$or: \[\s*\{ expiresAt: null \},\s*\{ expiresAt: \{ \$gt: new Date\(\) \} \}\s*\]\s*\};/m,
  'const query = getBaseActiveJobQuery();'
);

content = content.replace(
  /\/\/ Show all active jobs \(both internal and external\)\s*let query = \{ isActive: \{ \$ne: false \} \};/m,
  '// Show all active jobs (both internal and external)\n  let query = getBaseActiveJobQuery();'
);

fs.writeFileSync(path, content);
console.log('jobController.js patched successfully!');
