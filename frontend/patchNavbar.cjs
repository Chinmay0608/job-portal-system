const fs = require('fs');
const path = 'D:/MERN Project/job-portal/frontend/src/Components/Navbar.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\*\s*Logo\s*\*\/\}\s*<Link className="navbar-brand premium-logo" to="\/">\s*<span className="logo-skill">Skill<\/span><span className="logo-bridge">Bridge<\/span>\s*<\/Link>/;

const replacement = `{/* Logo */}
      <Link 
        className="navbar-brand premium-logo" 
        to={isLoggedIn ? (user?.role === 'recruiter' ? '/recruiter-dashboard' : user?.role === 'admin' ? '/admin-dashboard' : '/candidate-dashboard') : '/'}
        onClick={(e) => {
          if (isLoggedIn) {
            const dashboardUrl = user?.role === 'recruiter' ? '/recruiter-dashboard' : user?.role === 'admin' ? '/admin-dashboard' : '/candidate-dashboard';
            if (location.pathname === dashboardUrl) {
              e.preventDefault();
              window.location.reload();
            }
          }
        }}
      >
        <span className="logo-skill">Skill</span><span className="logo-bridge">Bridge</span>
      </Link>`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
  console.log('Navbar logo link updated successfully via regex');
} else {
  console.log('Target string not found with regex');
}
