const fs = require('fs');

const pathR = 'D:/MERN Project/job-portal/frontend/src/Styles/pages/recruiter/RecruiterDashboard.css';
let contentR = fs.readFileSync(pathR, 'utf8');
const bgCSSR = `
/* INDEED STYLE BACKGROUND SHAPE */
.recruiter-dashboard-shell { position: relative; z-index: 0; }
.recruiter-dashboard-shell::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 500px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 500'%3E%3Cpath fill='%23e8f1ff' fill-opacity='1' d='M0,0L1440,0L1440,250C1000,450 500,-50 0,200Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover; background-repeat: no-repeat; background-position: top center; z-index: -1; pointer-events: none;
}
`;
if (!contentR.includes('INDEED STYLE BACKGROUND SHAPE')) {
  fs.writeFileSync(pathR, contentR + bgCSSR);
}

const pathA = 'D:/MERN Project/job-portal/frontend/src/Styles/AdminDashboard.css';
let contentA = fs.readFileSync(pathA, 'utf8');
const bgCSSA = `
/* INDEED STYLE BACKGROUND SHAPE */
.admin-dashboard-container { position: relative; z-index: 0; }
.admin-dashboard-container::before {
  content: ""; position: absolute; top: 0; left: 0; right: 0; height: 500px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 500'%3E%3Cpath fill='%23e8f1ff' fill-opacity='1' d='M0,0L1440,0L1440,250C1000,450 500,-50 0,200Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover; background-repeat: no-repeat; background-position: top center; z-index: -1; pointer-events: none;
}
`;
if (!contentA.includes('INDEED STYLE BACKGROUND SHAPE')) {
  fs.writeFileSync(pathA, contentA + bgCSSA);
}
console.log('Added Indeed-style background to Recruiter and Admin dashboard CSS');
