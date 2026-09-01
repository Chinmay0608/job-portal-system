const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/Components/Footer.jsx';
let content = fs.readFileSync(path, 'utf8');

// We can just remove the span
content = content.replace(
  /<span className="footer-bottom-right">Made with ❤️ for builders everywhere<\/span>/,
  ''
);

fs.writeFileSync(path, content);
console.log('Removed text from footer');
