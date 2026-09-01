const fs = require('fs');
const jsxPath = 'D:/MERN Project/job-portal/frontend/src/Components/Navbar.jsx';
let jsxContent = fs.readFileSync(jsxPath, 'utf8');

jsxContent = jsxContent.replace(
  /const isDashboardTheme = false; \/\/ Deprecated dark mode for dashboardsimport React, \{ useEffect, useState \} from "react";/,
  'import React, { useEffect, useState } from "react";'
);

// We need to redefine isDashboardTheme inside the component.
// Let's add it right after "const isRecruiterPage = ..."
jsxContent = jsxContent.replace(
  /const isRecruiterPage = \["\/recruiter-dashboard", "\/recruiter-applications", "\/recruiter-profile"\]\.includes\(location\.pathname\);/,
  'const isRecruiterPage = ["/recruiter-dashboard", "/recruiter-applications", "/recruiter-profile"].includes(location.pathname);\n  const isDashboardTheme = false;'
);

fs.writeFileSync(jsxPath, jsxContent);
console.log('Fixed Navbar.jsx');
