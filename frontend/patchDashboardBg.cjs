const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/Styles/pages/candidate/CandidateDashboard.css';
let content = fs.readFileSync(path, 'utf8');

// The original background is:
// .ind-dashboard {
//   background-color: #f7f7f5;
//   min-height: 100vh;
// }

const target = `.ind-dashboard {
  background-color: #f7f7f5;
  min-height: 100vh;`;

const replacement = `.ind-dashboard {
  background-color: #f7f7f5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 600'%3E%3Cpath fill='%23e6f0ff' fill-opacity='0.5' d='M0,192L48,176C96,160,192,128,288,144C384,160,480,224,576,213.3C672,203,768,117,864,96C960,75,1056,117,1152,149.3C1248,181,1344,203,1392,213.3L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: top left;
  min-height: 100vh;`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content);
console.log('CandidateDashboard.css patched with wave background');
