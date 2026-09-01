const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/controllers/jobController.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /thirtyDaysAgo\.setDate\(thirtyDaysAgo\.getDate\(\) - 60\); \/\/ Extended to 60 for demo purposes/,
  `thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);`
);

fs.writeFileSync(path, content);
console.log('Restored 30 days active jobs window');
