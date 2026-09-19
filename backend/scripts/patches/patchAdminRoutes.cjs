const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/routes/adminRoutes.js';
let content = fs.readFileSync(path, 'utf8');

const newRoutes = `
const { getConfig, setConfig, getCompaniesAdmin, updateCompanyAdmin } = require('../controllers/adminConfigController');

// Config Routes
router.get('/config', protect, authorizeRoles('recruiter'), getConfig);
router.put('/config/:key', protect, authorizeRoles('recruiter'), setConfig);

// Company Registry Admin Routes
router.get('/companies', protect, authorizeRoles('recruiter'), getCompaniesAdmin);
router.put('/companies/:id', protect, authorizeRoles('recruiter'), updateCompanyAdmin);
`;

if (!content.includes('adminConfigController')) {
  content = content.replace(/module\.exports = router;/, newRoutes + '\nmodule.exports = router;');
  fs.writeFileSync(path, content);
  console.log('Added config routes to adminRoutes.js');
}
