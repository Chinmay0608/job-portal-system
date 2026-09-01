const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/legal/CookiePolicy.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /import "\.\.\/\.\.\/Components\/LegalLayout";/,
  `import LegalLayout from "../../Components/LegalLayout";`
);

fs.writeFileSync(path, content);
console.log('Fixed CookiePolicy import');
