const fs = require('fs');

const cssFiles = [
  'D:/MERN Project/job-portal/frontend/src/Styles/pages/recruiter/RecruiterDashboard.css',
  'D:/MERN Project/job-portal/frontend/src/Styles/pages/admin/AdminDashboard.css'
];

cssFiles.forEach(path => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Most likely they use `.dashboard-container` or `.admin-dashboard` etc.
    // Let's just append a generic `.dashboard-bg-wave` class that we can apply.
    const waveCSS = `
/* GLOBAL DASHBOARD WAVE BACKGROUND */
.dashboard-bg-wave {
  background-color: #f7f7f5 !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 600'%3E%3Cpath fill='%23eaf0fa' fill-opacity='1' d='M0,0L1440,0L1440,400C1100,50 800,600 0,300Z'%3E%3C/path%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-size: cover !important;
  background-position: top center !important;
  background-attachment: fixed !important;
}
`;
    content += waveCSS;
    fs.writeFileSync(path, content);
  }
});
console.log('Appended dashboard-bg-wave to other dash CSS files');
