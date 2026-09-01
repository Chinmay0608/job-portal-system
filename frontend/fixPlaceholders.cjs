const fs = require('fs');

const jsxPath = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/CandidateDashboard.jsx';
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

jsxContent = jsxContent.replace(
  /const \[experienceFilter, setExperienceFilter\] = useState\("All Experience"\);/g,
  'const [experienceFilter, setExperienceFilter] = useState("");'
);

jsxContent = jsxContent.replace(
  /const \[sourceFilter, setSourceFilter\] = useState\("All"\);/g,
  'const [sourceFilter, setSourceFilter] = useState("");'
);

// We should also pass a proper placeholder to CustomSelect just in case
jsxContent = jsxContent.replace(
  /className="desktop-experience-select ind-select"/g,
  'placeholder="Select..." className="desktop-experience-select ind-select"'
);

fs.writeFileSync(jsxPath, jsxContent);

const cssPath = 'D:/MERN Project/job-portal/frontend/src/Styles/pages/candidate/CandidateDashboard.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

cssContent = cssContent.replace(
  /background-image: url\("data:image\/svg\+xml;charset=UTF-8[^"]+"\)[^;]*;/g,
  '/* removed caret bg */'
);

fs.writeFileSync(cssPath, cssContent);
console.log('Fixed placeholders and double carets');
