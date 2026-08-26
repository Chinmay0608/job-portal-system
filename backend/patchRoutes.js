const fs = require('fs');
let c = fs.readFileSync('D:/MERN Project/job-portal/backend/routes/jobRoutes.js', 'utf8');

if (!c.includes('/generate-description')) {
  c = c.replace(/router\.post\(\s*"\/create",/, 
`// AI Job Description Generator Route
router.post(
  "/generate-description",
  protect,
  authorizeRoles("recruiter", "admin"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("company").notEmpty().withMessage("Company is required"),
  ],
  validateRequest,
  generateJobDescription
);

router.post(
  "/create",`);
}

fs.writeFileSync('D:/MERN Project/job-portal/backend/routes/jobRoutes.js', c);
