const fs = require('fs');

// 1. Update Application Model
const modelPath = 'D:/MERN Project/job-portal/backend/models/application.js';
let modelStr = fs.readFileSync(modelPath, 'utf8');
modelStr = modelStr.replace(
  /enum:\s*\["pending",\s*"shortlisted",\s*"rejected",\s*"applied_externally"\]/,
  'enum: ["pending", "shortlisted", "rejected", "applied_externally", "selected"]'
);
fs.writeFileSync(modelPath, modelStr);

// 2. Update Application Routes (remove authorizeRoles("recruiter") for update route)
const routePath = 'D:/MERN Project/job-portal/backend/routes/applicationRoutes.js';
let routeStr = fs.readFileSync(routePath, 'utf8');
routeStr = routeStr.replace(
  /router\.patch\(\s*["']\/update\/:applicationId["'],\s*protect,\s*authorizeRoles\([^)]+\),\s*updateApplicationStatus\s*\);/g,
  'router.patch("/update/:applicationId", protect, updateApplicationStatus);'
);
fs.writeFileSync(routePath, routeStr);

// 3. Update Application Controller
const controllerPath = 'D:/MERN Project/job-portal/backend/controllers/applicationController.js';
let ctrlStr = fs.readFileSync(controllerPath, 'utf8');
ctrlStr = ctrlStr.replace(
  /const validStatuses = \['pending', 'shortlisted', 'rejected', 'applied_externally'\];/,
  "const validStatuses = ['pending', 'shortlisted', 'rejected', 'applied_externally', 'selected'];"
);
ctrlStr = ctrlStr.replace(
  /if\s*\(\s*application\.job\.recruiter\.toString\(\)\s*!==\s*req\.user\.id\s*\)\s*\{\s*res\.status\(403\);\s*throw new Error\("Access denied"\);\s*\}/,
  `if (application.job.recruiter.toString() !== req.user.id && application.candidate._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }`
);
fs.writeFileSync(controllerPath, ctrlStr);

console.log('Backend patched successfully');
