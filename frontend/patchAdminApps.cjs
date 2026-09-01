const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('import ApplicationsView')) {
  content = content.replace(
    /import JobsRegistryView from "\.\/JobsRegistryView";/,
    `import JobsRegistryView from "./JobsRegistryView";\nimport ApplicationsView from "./ApplicationsView";`
  );
}

// 2. Replace the Applications placeholder block with the component
const placeholderRegex = /<div className="admin-tab-content">\s*<h2>Applications<\/h2>\s*<p>\[View Coming Soon\]<\/p>\s*<\/div>/;
if (placeholderRegex.test(content)) {
  content = content.replace(placeholderRegex, `<ApplicationsView />`);
}

fs.writeFileSync(path, content);
console.log('Patched AdminDashboard.jsx to use ApplicationsView');
