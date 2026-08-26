const fs = require('fs');

// 1. Fix CandidateDashboard.jsx
let cd = fs.readFileSync('D:/MERN Project/job-portal/frontend/src/pages/candidate/CandidateDashboard.jsx', 'utf8');
const formatSalaryRegex = /const formatSalary = \(salaryText, min, max, currency\) => \{[\s\S]*?return `.*`;\n\};/;
const newFormatSalary = `const formatSalary = (salaryText, min, max, currency) => {
  const getSymbol = (curr) => curr === 'INR' || curr === '₹' ? '₹' : (curr === 'USD' || curr === '$' ? '$' : (curr ? curr + ' ' : ''));
  const sym = getSymbol(currency);

  if (min && max) {
    const formatShorthand = (num) => {
      if (num >= 100000) return \`\${sym}\${num / 100000}L\`;
      if (num >= 1000) return \`\${sym}\${num / 1000}k\`;
      return \`\${sym}\${num}\`;
    };
    return \`\${formatShorthand(min)} - \${formatShorthand(max)}\`;
  }
  
  if (typeof salaryText === 'string' && isNaN(Number(salaryText))) return salaryText;
  if (!salaryText || Number(salaryText) === 0) return "Competitive";
  
  return \`\${sym}\${Number(salaryText).toLocaleString("en-US")} a year\`.trim();
};`;
cd = cd.replace(formatSalaryRegex, newFormatSalary);
fs.writeFileSync('D:/MERN Project/job-portal/frontend/src/pages/candidate/CandidateDashboard.jsx', cd);

// 2. Fix RecruiterDashboard.jsx
let rd = fs.readFileSync('D:/MERN Project/job-portal/frontend/src/pages/recruiter/RecruiterDashboard.jsx', 'utf8');
rd = rd.replace(/`₹\$\{Number\(job\.salary\)\.toLocaleString\("en-IN"\)\}`/g, '`${Number(job.salary).toLocaleString("en-US")}`');
fs.writeFileSync('D:/MERN Project/job-portal/frontend/src/pages/recruiter/RecruiterDashboard.jsx', rd);

// 3. Fix RecruiterApplications.jsx
let ra = fs.readFileSync('D:/MERN Project/job-portal/frontend/src/pages/recruiter/RecruiterApplications.jsx', 'utf8');
ra = ra.replace(/<p>₹ \{selectedApplication\.job\?\.salary \|\| "N\/A"\}<\/p>/g, '<p>{selectedApplication.job?.salary || "N/A"}</p>');
fs.writeFileSync('D:/MERN Project/job-portal/frontend/src/pages/recruiter/RecruiterApplications.jsx', ra);

console.log("Fixed hardcoded currency symbols.");
