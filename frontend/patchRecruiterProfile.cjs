const fs = require('fs');

const jsxPath = 'D:/MERN Project/job-portal/frontend/src/pages/recruiter/recruiterProfile.jsx';
const cssPath = 'D:/MERN Project/job-portal/frontend/src/Styles/pages/recruiter/recruiterProfile.css';

let jsx = fs.readFileSync(jsxPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Update placeholders in JSX
jsx = jsx.replace(/placeholder="Enter phone"/g, 'placeholder="+91 98765 43210"');
jsx = jsx.replace(/placeholder="LinkedIn URL"/g, 'placeholder="linkedin.com/in/yourname"');

// 2. Change Update Password button class to 'update-password-btn' (currently 'save-btn')
jsx = jsx.replace(
  /<button type="button" className="save-btn" onClick=\{handleChangePassword\}/g,
  '<button type="button" className="update-password-btn" onClick={handleChangePassword}'
);

// 3. Add visual separation to the Change Password card
jsx = jsx.replace(
  /<div className="profile-section-card">\s*<h2 className="profile-section-title">Change password<\/h2>/g,
  '<div className="profile-section-card password-card">\n            <h2 className="profile-section-title">Change password</h2>'
);

fs.writeFileSync(jsxPath, jsx);

// 4. Update CSS

// - Avatar edit icon padding
css = css.replace(
  /\.upload-avatar-btn \{\s*position: absolute;\s*bottom: -2px;\s*right: -2px;/g,
  '.upload-avatar-btn {\n  position: absolute;\n  bottom: 0;\n  right: 0;\n  border: 3px solid #ffffff;'
);
css = css.replace(
  /\.upload-avatar-btn \{\s*width: 30px;\s*height: 30px;/g,
  'width: 34px;\n  height: 34px;'
);

// - Change RECRUITER badge to Amber
css = css.replace(
  /\.role-badge \{\s*background: #fff1f1;\s*color: #ef4444;/g,
  '.role-badge {\n  background: #fef3c7;\n  color: #E8833A;'
);

// - Set headings to Brand Navy
css = css.replace(
  /\.profile-section-title \{\s*font-size: 1.15rem;\s*font-weight: 800;\s*color: #0d1117;/g,
  '.profile-section-title {\n  font-size: 1.15rem;\n  font-weight: 800;\n  color: #1B2A4A;' 
);
if (!css.includes('color: #1B2A4A;')) {
    css += `\n.profile-section-title { color: #1B2A4A !important; }\n`;
}

// - Change .save-btn from Red to Navy (#1B2A4A)
css = css.replace(
  /\.save-btn \{\s*background: #ef4444;\s*color: #ffffff;/g,
  '.save-btn {\n  background: #1B2A4A;\n  color: #ffffff;'
);
css = css.replace(
  /\.save-btn:hover \{\s*background: #dc2626;/g,
  '.save-btn:hover {\n  background: #0f182b;'
);

// - Add .update-password-btn style (Secondary/Outlined)
const updatePasswordCss = `
.update-password-btn {
  background: transparent;
  color: #1B2A4A;
  border: 2px solid #1B2A4A;
  padding: 11px 30px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.update-password-btn:hover {
  background: #f8fafc;
}

.update-password-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Password Card Visual Separation */
.password-card {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}
`;

css += updatePasswordCss;

fs.writeFileSync(cssPath, css);
console.log("Patched Recruiter Profile UI");
