import { Link } from "react-router-dom";
import "../Styles/pages/Legal.css";

function LegalLayout({ title, children }) {
  return (
    <div className="legal-page">
      <div className="legal-container">

        <aside className="legal-sidebar">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-use">Terms of Use</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
          <Link to="/security">Security</Link>
        </aside>

        <main className="legal-content">
          <h1>{title}</h1>
          {children}
        </main>

      </div>
    </div>
  );
}

export default LegalLayout;