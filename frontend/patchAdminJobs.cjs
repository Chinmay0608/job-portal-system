const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('import JobsRegistryView')) {
  content = content.replace(
    /import "\.\.\/\.\.\/Styles\/pages\/admin\/AdminDashboard\.css";/,
    `import "../../Styles/pages/admin/AdminDashboard.css";\nimport JobsRegistryView from "./JobsRegistryView";`
  );
}

// 2. Replace the Jobs placeholder block with the component
const placeholderRegex = /<div className="admin-tab-content">\s*<h2>Jobs Registry<\/h2>\s*<p>\[View Coming Soon\]<\/p>\s*<\/div>/;
if (placeholderRegex.test(content)) {
  content = content.replace(placeholderRegex, `<JobsRegistryView />`);
}

fs.writeFileSync(path, content);
console.log('Patched AdminDashboard.jsx to use JobsRegistryView');
