const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/routes/applicationRoutes.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getApplicationsAdmin')) {
  // Add import
  content = content.replace(
    /const \{([\s\S]*?)\} = require\("\.\.\/controllers\/applicationController"\);/,
    `const { getApplicationsAdmin, $1 } = require("../controllers/applicationController");`
  );
  
  // Add route before /:jobId
  const adminRoute = `
// Admin Route
router.get("/admin/all", protect, authorizeRoles("recruiter"), getApplicationsAdmin);

router.get("/:jobId",`;
  
  if (content.includes('router.get("/:jobId"')) {
    content = content.replace(/router\.get\("\/:jobId",/, adminRoute);
  } else {
    // If not matching, append
    content += `\nrouter.get("/admin/all", protect, authorizeRoles("recruiter"), getApplicationsAdmin);\n`;
  }
  
  fs.writeFileSync(path, content);
  console.log('Added /admin/all to applicationRoutes.js');
}
