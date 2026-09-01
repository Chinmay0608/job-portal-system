const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/Styles/pages/candidate/CandidateDashboard.css';
let content = fs.readFileSync(path, 'utf8');

const bgCSS = `

/* INDEED STYLE BACKGROUND SHAPE */
.ind-dashboard {
  position: relative;
  z-index: 0;
}

.ind-dashboard::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 500px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 500'%3E%3Cpath fill='%23e8f1ff' fill-opacity='1' d='M0,0L1440,0L1440,250C1000,450 500,-50 0,200Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: top center;
  z-index: -1;
  pointer-events: none;
}
`;

if (!content.includes('INDEED STYLE BACKGROUND SHAPE')) {
  content += bgCSS;
  fs.writeFileSync(path, content);
  console.log('Added Indeed-style background to CandidateDashboard.css');
}
