const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/controllers/jobController.js';
let content = fs.readFileSync(path, 'utf8');

// Change thirtyDaysAgo to 60 days
content = content.replace(
  /thirtyDaysAgo\.setDate\(thirtyDaysAgo\.getDate\(\) - 30\);/g,
  'thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60); // Extended to 60 for demo purposes'
);

fs.writeFileSync(path, content);
console.log('Updated expiration threshold to 60 days');
