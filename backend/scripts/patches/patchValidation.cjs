const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/routes/userRoutes.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /body\("phone"\)\s*\.optional\(\)/,
  'body("phone").optional({ checkFalsy: true })'
);

content = content.replace(
  /body\("companyWebsite"\)\s*\.optional\(\)/,
  'body("companyWebsite").optional({ checkFalsy: true })'
);

// Also maybe name? Name is required to be at least 2 chars, but if they send ""?
// Let's just fix phone and companyWebsite as they are the ones using strict validation formats
content = content.replace(
  /body\("name"\)\s*\.optional\(\)/,
  'body("name").optional({ checkFalsy: true })'
);

fs.writeFileSync(path, content);
console.log('Fixed optional validations');
