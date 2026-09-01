const fs = require('fs');

const jsxPath = 'D:/MERN Project/job-portal/frontend/src/Components/Navbar.jsx';
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

// Remove candidate-nav class logic
jsxContent = jsxContent.replace(
  /const isDashboardTheme = isCandidatePage || isRecruiterPage;/,
  'const isDashboardTheme = false; // Deprecated dark mode for dashboards'
);

fs.writeFileSync(jsxPath, jsxContent);

const cssPath = 'D:/MERN Project/job-portal/frontend/src/Styles/Components/Navbar.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Replace .candidate-nav selectors so they just behave like normal white navbar
cssContent = cssContent.replace(/\.custom-navbar\.candidate-nav \{[\s\S]*?\}/g, '');
cssContent = cssContent.replace(/\.custom-navbar\.candidate-nav \.logo-bridge \{[\s\S]*?\}/g, '');
cssContent = cssContent.replace(/\.custom-navbar\.candidate-nav \.mobile-menu-toggle \{[\s\S]*?\}/g, '');
cssContent = cssContent.replace(/\.custom-navbar\.candidate-nav \.nav-link \{[\s\S]*?\}/g, '');
cssContent = cssContent.replace(/\.custom-navbar\.candidate-nav \.nav-link:hover \{[\s\S]*?\}/g, '');
cssContent = cssContent.replace(/\.custom-navbar\.candidate-nav \.dashboard-btn \{[\s\S]*?\}/g, '');
cssContent = cssContent.replace(/\.custom-navbar\.candidate-nav \.dashboard-btn:hover \{[\s\S]*?\}/g, '');

cssContent = cssContent.replace(/:not\(\.candidate-nav\)/g, '');

fs.writeFileSync(cssPath, cssContent);
console.log('Removed dark candidate-nav styles');
