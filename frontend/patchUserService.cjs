const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/Services/userService.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('export const updateApplicationStatus')) {
  content += `\nexport const updateApplicationStatus = async (applicationId, status) => {
  const { data } = await api.patch(\`/api/applications/update/\${applicationId}\`, { status });
  return data;
};\n`;
  fs.writeFileSync(path, content);
  console.log('Added updateApplicationStatus to userService');
} else {
  console.log('Already exists');
}
