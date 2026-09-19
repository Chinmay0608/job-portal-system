const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/routes/jobRoutes.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getJobsAdmin')) {
  // Add import
  content = content.replace(
    /const \{([\s\S]*?)\} = require\("\.\.\/controllers\/jobController"\);/,
    `const { getJobsAdmin, $1 } = require("../controllers/jobController");`
  );
  
  // Add route before /:id
  const adminRoute = `
// Admin Route
router.get("/admin/all", protect, authorizeRoles("recruiter"), getJobsAdmin);

router.get("/:id",`;
  content = content.replace(/router\.get\("\/:id",/, adminRoute);
  
  fs.writeFileSync(path, content);
  console.log('Added /admin/all to jobRoutes.js');
}
