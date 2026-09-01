const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/admin/AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /onClick=\{\(\) => navigate\("\/"\)\}/g;
content = content.replace(regex, 'onClick={() => window.location.reload()}');

fs.writeFileSync(path, content);
console.log('Patched AdminDashboard logo link');
