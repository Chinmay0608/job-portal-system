import { NavLink } from "react-router-dom";
import "../Styles/pages/Legal.css";

function LegalLayout({
  title,
  children,
}) {
  return (
    <div className="legal-page">
      <div className="legal-wrapper">

        {/* Sidebar */}
        <aside className="legal-sidebar">
          <h3>Legal</h3>

          <NavLink
            to="/privacy-policy"
            className={({ isActive }) =>
              isActive
                ? "legal-link active"
                : "legal-link"
            }
          >
            Privacy Policy
          </NavLink>

          <NavLink
            to="/terms-of-use"
            className={({ isActive }) =>
              isActive
                ? "legal-link active"
                : "legal-link"
            }
          >
            Terms of Use
          </NavLink>

          <NavLink
            to="/cookie-policy"
            className={({ isActive }) =>
              isActive
                ? "legal-link active"
                : "legal-link"
            }
          >
            Cookie Policy
          </NavLink>

          <NavLink
            to="/security"
            className={({ isActive }) =>
              isActive
                ? "legal-link active"
                : "legal-link"
            }
          >
            Security
          </NavLink>
        </aside>

        {/* Content */}
        <main className="legal-content">
          <h1>{title}</h1>

          <div className="legal-divider"></div>

          <div className="legal-body">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

export default LegalLayout;