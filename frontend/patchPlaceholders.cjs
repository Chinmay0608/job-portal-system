const fs = require('fs');

const fixPlaceholders = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const replacements = {
    'placeholder="+91 98765 43210"': 'placeholder="e.g., +91 98765 43210"',
    'placeholder="Jaipur, India"': 'placeholder="e.g., Jaipur, India"',
    'placeholder="linkedin.com/in/yourname"': 'placeholder="e.g., linkedin.com/in/yourname"',
    'placeholder="github.com/yourname"': 'placeholder="e.g., github.com/yourname"',
    'placeholder="https://yourcompany.com"': 'placeholder="e.g., https://yourcompany.com"',
  };

  for (const [oldP, newP] of Object.entries(replacements)) {
    content = content.replace(new RegExp(oldP.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newP);
  }

  // Also replace any existing "e.g. " (without comma) to "e.g., " for consistency, if desired, but not strictly necessary. Let's just fix the ones asked.

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
};

fixPlaceholders('D:/MERN Project/job-portal/frontend/src/pages/candidate/candidateProfile.jsx');
fixPlaceholders('D:/MERN Project/job-portal/frontend/src/pages/recruiter/recruiterProfile.jsx');
