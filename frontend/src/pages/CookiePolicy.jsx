import { Link } from "react-router-dom";
import "../Styles/pages/Legal.css";

function CookiePolicy() {
  return (
    <div className="legal-page">

      {/* Sidebar */}
      <aside className="legal-sidebar">
        <h3>Legal</h3>

        <Link to="/privacy-policy">
          Privacy Policy
        </Link>

        <Link to="/terms-of-use">
          Terms of Use
        </Link>

        <Link
          to="/cookie-policy"
          className="active-legal-link"
        >
          Cookie Policy
        </Link>

        <Link to="/security">
          Security
        </Link>
      </aside>

      {/* Content */}
      <main className="legal-content">
        <h1>Cookie Policy</h1>

        <section>
          <h2>1. What Are Cookies?</h2>

          <p>
            Cookies are small text files stored on your
            device when you visit a website. They help
            websites remember user preferences, improve
            performance, and provide a better browsing
            experience.
          </p>
        </section>

        <section>
          <h2>2. How SkillBridge Uses Cookies</h2>

          <p>
            SkillBridge uses cookies to improve platform
            functionality, enhance user experience,
            remember login preferences, and analyze
            platform usage patterns.
          </p>
        </section>

        <section>
          <h2>3. Types of Cookies We Use</h2>

          <p>
            <strong>Essential Cookies:</strong> Required
            for authentication, account access, and
            platform functionality.
          </p>

          <p>
            <strong>Performance Cookies:</strong> Help us
            understand how users interact with SkillBridge
            so we can improve features and performance.
          </p>

          <p>
            <strong>Preference Cookies:</strong> Save your
            preferences such as theme, settings, or
            frequently visited sections.
          </p>

          <p>
            <strong>Analytics Cookies:</strong> Used to
            gather anonymous insights into user behavior
            and website traffic.
          </p>
        </section>

        <section>
          <h2>4. Third-Party Cookies</h2>

          <p>
            Some third-party services integrated into
            SkillBridge, such as authentication providers,
            analytics tools, or external integrations,
            may place cookies on your device.
          </p>
        </section>

        <section>
          <h2>5. Managing Cookies</h2>

          <p>
            You can control or disable cookies through
            your browser settings. However, disabling
            essential cookies may affect certain platform
            features such as login and job applications.
          </p>
        </section>

        <section>
          <h2>6. Updates to This Policy</h2>

          <p>
            SkillBridge may update this Cookie Policy
            periodically to reflect changes in technology,
            legal requirements, or platform improvements.
          </p>
        </section>

        <section>
          <h2>7. Contact Us</h2>

          <p>
            If you have questions regarding our Cookie
            Policy, please contact us at:
          </p>

          <p>
            <strong>Email:</strong> support@skillbridge.com
          </p>
        </section>

      </main>
    </div>
  );
}

export default CookiePolicy;