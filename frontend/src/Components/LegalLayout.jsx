import { NavLink } from "react-router-dom";
import "../Styles/components/Legal.css";

function LegalLayout({ title, children }) {
  return (
    <div className="wf-legal-root">
      <div className="wf-legal-grid">

        {/* Minimal Wellfound Sidebar Layout */}
        <aside className="wf-legal-sidebar">
          <NavLink
            to="/privacy-policy"
            className={({ isActive }) =>
              isActive ? "wf-sidebar-item active" : "wf-sidebar-item"
            }
          >
            Privacy Policy
          </NavLink>

          <NavLink
            to="/terms-of-use"
            className={({ isActive }) =>
              isActive ? "wf-sidebar-item active" : "wf-sidebar-item"
            }
          >
            Terms of Use
          </NavLink>

          <NavLink
            to="/cookie-policy"
            className={({ isActive }) =>
              isActive ? "wf-sidebar-item active" : "wf-sidebar-item"
            }
          >
            Cookie Policy
          </NavLink>

          <NavLink
            to="/security"
            className={({ isActive }) =>
              isActive ? "wf-sidebar-item active" : "wf-sidebar-item"
            }
          >
            Security
          </NavLink>
        </aside>

        {/* Content Box */}
        <main className="wf-legal-panel">
          <h1 className="wf-panel-title">{title}</h1>
          <div className="wf-panel-divider"></div>
          <div className="wf-panel-body">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

export default LegalLayout;