const fs = require('fs');
const jsxPath = 'D:/MERN Project/job-portal/frontend/src/Components/Navbar.jsx';
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

// Enable isDashboardTheme again
jsxContent = jsxContent.replace(
  /const isDashboardTheme = false;/g,
  'const isDashboardTheme = isCandidatePage || isRecruiterPage || location.pathname.includes("/admin");'
);

// We need to change `.candidate-nav` in the template string to `.dashboard-nav`
jsxContent = jsxContent.replace(
  /\$\{isDashboardTheme \? " candidate-nav" : ""\}/,
  '${isDashboardTheme ? " dashboard-nav" : ""}'
);

fs.writeFileSync(jsxPath, jsxContent);

const cssPath = 'D:/MERN Project/job-portal/frontend/src/Styles/Components/Navbar.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newCSS = `
/* MATCH DASHBOARD WAVE BACKGROUND */
.custom-navbar.dashboard-nav {
  background-color: #e8f1ff !important;
  border-bottom: none !important;
  box-shadow: none !important;
}
.custom-navbar.dashboard-nav .login-btn,
.custom-navbar.dashboard-nav .dashboard-btn {
  background: #ffffff;
  border-color: #e5e7eb;
}
`;

if (!cssContent.includes('MATCH DASHBOARD WAVE BACKGROUND')) {
  fs.writeFileSync(cssPath, cssContent + newCSS);
}

console.log('Patched Navbar to match dashboard background wave!');
