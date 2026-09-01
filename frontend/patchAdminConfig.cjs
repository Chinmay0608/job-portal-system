const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
if (!content.includes('import ConfigView')) {
  content = content.replace(
    /import ApplicationsView from "\.\/ApplicationsView";/,
    `import ApplicationsView from "./ApplicationsView";\nimport ConfigView from "./ConfigView";`
  );
}

// Replace Config placeholder
const placeholderRegex = /<div className="admin-tab-content">\s*<h2>Configuration<\/h2>\s*<p>\[View Coming Soon\]<\/p>\s*<\/div>/;
if (placeholderRegex.test(content)) {
  content = content.replace(placeholderRegex, `<ConfigView />`);
}

fs.writeFileSync(path, content);
console.log('Patched AdminDashboard.jsx to use ConfigView');
