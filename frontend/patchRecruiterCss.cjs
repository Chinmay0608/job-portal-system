const fs = require('fs');

const cssPath = 'D:/MERN Project/job-portal/frontend/src/Styles/pages/recruiter/recruiterProfile.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  /\.progress-fill\s*\{\s*height:\s*100%;\s*background:\s*#ef4444;\s*border-radius:\s*999px;\s*transition:\s*width\s*0\.4s\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);\s*\}/g,
  `.progress-fill {\n  height: 100%;\n  background: #1B2A4A;\n  border-radius: 999px;\n  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);\n}`
);

fs.writeFileSync(cssPath, css);
console.log('Fixed recruiter profile css');
