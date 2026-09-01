const fs = require('fs');
const p = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/MyApplications.jsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<Link to="\/" className="browse-jobs-btn">/g, '<Link to="/candidate-dashboard" className="browse-jobs-btn">');
c = c.replace(/<Link to="\/" className="browse-jobs-btn-secondary">/g, '<Link to="/candidate-dashboard" className="browse-jobs-btn-secondary">');

fs.writeFileSync(p, c);
console.log('Replaced Links successfully');
