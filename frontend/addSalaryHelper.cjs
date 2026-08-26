const fs = require('fs');
let content = fs.readFileSync('D:/MERN Project/job-portal/frontend/src/pages/candidate/MyApplications.jsx', 'utf8');

const formatSalaryHelper = `
  const formatSalary = (job) => {
    if (!job.salary) return "Not specified";
    const raw = String(job.salary);
    // If it's not purely numeric (already has '$' or 'k', etc), return as is
    if (isNaN(Number(raw))) return raw;
    
    // Otherwise it's purely a number
    const formattedNum = Number(raw).toLocaleString("en-US");
    if (job.salaryCurrency === 'INR') return \`₹\${formattedNum}\`;
    if (job.salaryCurrency === 'USD') return \`$\${formattedNum}\`;
    if (job.salaryCurrency) return \`\${job.salaryCurrency} \${formattedNum}\`;
    return formattedNum;
  };
`;

content = content.replace('  const formatDate = (dateString)', formatSalaryHelper + '\n  const formatDate = (dateString)');
content = content.replace('<p className="job-salary">{application.job.salary}</p>', '<p className="job-salary">{formatSalary(application.job)}</p>');

fs.writeFileSync('D:/MERN Project/job-portal/frontend/src/pages/candidate/MyApplications.jsx', content);
console.log('Added formatSalary helper to MyApplications.jsx');
