import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-brand-col">
          <span className="footer-logo">SkillBridge</span>
          <p className="footer-tagline">Connecting talent and opportunity.<br />Built for the next generation of work.</p>
          <div className="footer-socials">
            <a href="#" aria-label="Twitter" className="footer-social-link">𝕏</a>
            <a href="#" aria-label="LinkedIn" className="footer-social-link">in</a>
            <a href="#" aria-label="GitHub" className="footer-social-link">⌥</a>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>For Candidates</h4>
            <a href="#">Browse Jobs</a>
            <a href="#">Remote Roles</a>
            <a href="#">Salary Data</a>
            <a href="#">Get Featured</a>
          </div>
          <div className="footer-col">
            <h4>For Companies</h4>
            <a href="#">Post a Job</a>
            <a href="#">AI Recruiting</a>
            <a href="#">Pricing</a>
            <a href="#">Success Stories</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Help Center</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Cookie Policy</a>
            <a href="#">Security</a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <span>© 2026 SkillBridge. All rights reserved.</span>
        <span className="footer-bottom-right">Made with ❤️ for builders everywhere</span>
      </div>
    </footer>
  );
}

export default Footer;