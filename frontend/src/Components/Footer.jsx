import { useNavigate } from "react-router-dom";
import "../Styles/components/Footer.css";

function Footer() {
  const navigate = useNavigate();

  const delayedNavigate = (path) => {
    setTimeout(() => {
      navigate(path);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }, 500);
  };

  const handleJobNavigation = (type) => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login", { state: { redirectAfterLogin: "/candidate-dashboard", roleType: type } });
    } else {
      navigate("/candidate-dashboard", { state: { roleType: type } });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <button className="footer-logo" onClick={() => delayedNavigate("/")}>SkillBridge</button>
          <p className="footer-tagline">Connecting talent and opportunity.<br />Built for the next generation of work.</p>
          <div className="footer-socials">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-link">𝕏</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-link">in</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social-link">⌥</a>
          </div>
        </div>

        {/* Links Navigation Grid */}
        <div className="footer-links-grid">
          <div className="footer-col">
            <div className="footer-col-heading">For Candidates</div>
            <button onClick={() => handleJobNavigation("all")}>Browse Jobs</button>
            <button onClick={() => handleJobNavigation("remote")}>Remote Roles</button>
            <button onClick={() => delayedNavigate("/salary-data")}>Salary Data</button>
            <button onClick={() => delayedNavigate("/get-featured")}>Get Featured</button>
          </div>

          <div className="footer-col">
            <div className="footer-col-heading">For Companies</div>
            <button onClick={() => navigate("/register", {state: { role: "recruiter" }, })}>Post a Job</button>
            <button onClick={() => delayedNavigate("/ai-recruiting")}>AI Recruiting</button>
            <button onClick={() => delayedNavigate("/register")}>Pricing</button>
            <button onClick={() => delayedNavigate("/success-stories")}>Success Stories</button>
          </div>

          <div className="footer-col">
            <div className="footer-col-heading">Company</div>
            <button onClick={() => delayedNavigate("/about")}>About</button>
            <button onClick={() => delayedNavigate("/blog")}>Blog</button>
            <button onClick={() => delayedNavigate("/careers")}>Careers</button>
            <button onClick={() => delayedNavigate("/help-center")}>Help Center</button>
          </div>

          <div className="footer-col">
            <div className="footer-col-heading">Legal</div>
            <button onClick={() => delayedNavigate("/privacy-policy")}>Privacy Policy</button>
            <button onClick={() => delayedNavigate("/terms-of-use")}>Terms of Use</button>
            <button onClick={() => delayedNavigate("/cookie-policy")}>Cookie Policy</button>
            <button onClick={() => delayedNavigate("/security")}>Security</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 SkillBridge. All rights reserved.</span>
        
      </div>
    </footer>
  );
}

export default Footer;