const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/pages/candidate/CandidateDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the desktop dropdown
const desktopRegex = /<div className="ind-input-divider desktop-only"><\/div>\s*<div className="ind-input-wrapper desktop-only">\s*<select\s*value=\{isRemoteFilter\}\s*onChange=\{\(e\) => setIsRemoteFilter\(e\.target\.value\)\}\s*className="desktop-experience-select ind-select"\s*>\s*<option value="All">Any Location<\/option>\s*<option value="true">Remote Only<\/option>\s*<\/select>\s*<\/div>/g;
content = content.replace(desktopRegex, '');

// 2. Remove the mobile dropdown
const mobileRegex = /<div className="sheet-input-group">\s*<select\s*value=\{isRemoteFilter\}\s*onChange=\{\(e\) => setIsRemoteFilter\(e\.target\.value\)\}\s*className="ind-select sheet-select"\s*>\s*<option value="All">Any Location<\/option>\s*<option value="true">Remote Only<\/option>\s*<\/select>\s*<\/div>/g;
content = content.replace(mobileRegex, '');

fs.writeFileSync(path, content);
console.log('Removed successfully!');
