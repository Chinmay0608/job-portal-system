const fs = require('fs');
const jsxPath = 'D:/MERN Project/job-portal/frontend/src/Components/Navbar.jsx';
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

// Replace ANY instance of `const isDashboardTheme = ...` with a single false assignment.
jsxContent = jsxContent.replace(/const isDashboardTheme = false;/g, '');
jsxContent = jsxContent.replace(/const isDashboardTheme = isCandidatePage \|\| isRecruiterPage;/g, 'const isDashboardTheme = false;');

fs.writeFileSync(jsxPath, jsxContent);
console.log('Fixed Navbar.jsx variables');
