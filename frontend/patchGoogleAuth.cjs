const fs = require('fs');

// --- Patch Login.jsx ---
const loginPath = 'D:/MERN Project/job-portal/frontend/src/pages/auth/Login.jsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');

const loginTarget = `  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);`;

const loginNew = `  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      const lastEmail = localStorage.getItem('last_google_email');
      if (lastEmail) {
        provider.setCustomParameters({ login_hint: lastEmail });
      } else {
        provider.setCustomParameters({});
      }
      
      const result = await signInWithPopup(auth, provider);
      localStorage.setItem('last_google_email', result.user.email);`;

loginContent = loginContent.replace(loginTarget, loginNew);
fs.writeFileSync(loginPath, loginContent);
console.log('Patched Login.jsx');


// --- Patch Register.jsx ---
const registerPath = 'D:/MERN Project/job-portal/frontend/src/pages/auth/Register.jsx';
let registerContent = fs.readFileSync(registerPath, 'utf8');

const registerTarget = `  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);`;

const registerNew = `  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      const lastEmail = localStorage.getItem('last_google_email');
      if (lastEmail) {
        provider.setCustomParameters({ login_hint: lastEmail });
      } else {
        provider.setCustomParameters({});
      }

      const result = await signInWithPopup(auth, provider);
      localStorage.setItem('last_google_email', result.user.email);`;

registerContent = registerContent.replace(registerTarget, registerNew);
fs.writeFileSync(registerPath, registerContent);
console.log('Patched Register.jsx');


// --- Patch authUtils.js ---
const authUtilsPath = 'D:/MERN Project/job-portal/frontend/src/Services/authUtils.js';
let authUtilsContent = fs.readFileSync(authUtilsPath, 'utf8');

if (!authUtilsContent.includes("localStorage.removeItem('last_google_email')")) {
  authUtilsContent = authUtilsContent.replace(
    /localStorage\.removeItem\("token"\);/g,
    `localStorage.removeItem("token");\n    localStorage.removeItem("last_google_email");`
  );
  fs.writeFileSync(authUtilsPath, authUtilsContent);
  console.log('Patched authUtils.js');
}
