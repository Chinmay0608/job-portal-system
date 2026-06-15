import { Link } from "react-router-dom";
import "../Styles/components/Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* Brand */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-logo">
            SkillBridge
          </Link>

          <p className="footer-tagline">
            Connecting talent and opportunity.
            <br />
            Built for the next generation of work.
          </p>

          <div className="footer-socials">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="footer-social-link"
            >
              𝕏
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="footer-social-link"
            >
              in
            </a>

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="footer-social-link"
            >
              ⌥
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="footer-links-grid">

          {/* Candidates */}
          <div className="footer-col">
            <h4>For Candidates</h4>

            <Link to="/candidate-dashboard">
              Browse Jobs
            </Link>

            <Link to="/candidate-dashboard">
              Remote Roles
            </Link>

            <Link to="/salary-data">
              Salary Data
            </Link>

            <Link to="/get-featured">
              Get Featured
            </Link>
          </div>

          {/* Companies */}
          <div className="footer-col">
            <h4>For Companies</h4>

            {/* Redirected because page doesn't exist */}
            <Link to="/recruiter-dashboard">
              Post a Job
            </Link>

            <Link to="/ai-recruiting">
              AI Recruiting
            </Link>

            {/* Redirected because page doesn't exist */}
            <Link to="/register">
              Pricing
            </Link>

            <Link to="/success-stories">
              Success Stories
            </Link>
          </div>

          {/* Company */}
          <div className="footer-col">
            <h4>Company</h4>

            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/careers">Careers</Link>

            <Link to="/help-center">
              Help Center
            </Link>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4>Legal</h4>

            <Link to="/privacy-policy">
              Privacy Policy
            </Link>

            <Link to="/terms-of-use">
              Terms of Use
            </Link>

            <Link to="/cookie-policy">
              Cookie Policy
            </Link>

            <Link to="/security">
              Security
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <span>© 2026 SkillBridge. All rights reserved.</span>

        <span className="footer-bottom-right">
          Made with ❤️ for builders everywhere
        </span>
      </div>
    </footer>
  );
}

export default Footer;