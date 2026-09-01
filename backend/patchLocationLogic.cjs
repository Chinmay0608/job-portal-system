const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/controllers/jobController.js';
let content = fs.readFileSync(path, 'utf8');

const replacement = `if (location) {
    if (location.trim().toLowerCase() === "remote") {
      query.isRemote = true;
    } else {
      query.location = { $regex: escapeRegex(location), $options: "i" };
    }
  }`;

content = content.replace(/if\s*\(location\)\s*\{\s*query\.location = \{\s*\$regex:\s*escapeRegex\(location\),\s*\$options:\s*"i"\s*\};\s*\}/, replacement);

fs.writeFileSync(path, content);
console.log('Backend location logic updated successfully');
