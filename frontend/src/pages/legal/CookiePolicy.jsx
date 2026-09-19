import LegalLayout from "../../Components/LegalLayout";

function CookiePolicy() {
  return (
    <LegalLayout title="Cookie & Local Storage Policy">
      <p className="effective-date">
        <strong>Last Updated:</strong> September 15, 2026 | <strong>Version:</strong> 2.2.0
      </p>

      <p>
        <strong>SkillBridge Technologies</strong> ("SkillBridge", "we", "us", or "our") uses HTTP cookies, HTML5 LocalStorage, SessionStorage, and similar browser tracking technologies across our website and application dashboards. This Cookie Policy explains what these technologies are, why we use them, and how you can manage your preferences.
      </p>

      <h2>1. What Are Cookies & Web Storage?</h2>
      <p>
        <strong>Cookies</strong> are small data text files placed on your computer, tablet, or mobile device by websites you visit. They enable websites to remember your session identity, store application preferences, and analyze how you interact with site features.
      </p>
      <p>
        <strong>HTML5 Web Storage (LocalStorage & SessionStorage)</strong> provides secure client-side key-value storage within your browser. SkillBridge uses LocalStorage to maintain fast performance and persistent login sessions across page navigations without re-transmitting sensitive data on every request.
      </p>

      <h2>2. Categories of Storage We Use</h2>
      <p>We deploy browser storage across four primary operational categories:</p>

      <h3>A. Essential Session & Security Storage</h3>
      <p>
        Crucial for platform stability, user authentication, and secure access. Without these trackers, core features like candidate login, recruiter job posting, and security safeguards cannot function.
      </p>
      <ul>
        <li><strong>Authentication Tokens (JWT):</strong> Validates active candidate, recruiter, or administrator sessions.</li>
        <li><strong>CSRF & Route Protection Tokens:</strong> Prevents unauthorized cross-site request forgery attacks.</li>
      </ul>

      <h3>B. Functional & Preference Storage</h3>
      <p>
        Remembers your personalized dashboard preferences and customized view settings.
      </p>
      <ul>
        <li><strong>User Interface State:</strong> Remembers your light/dark theme selection, sidebar toggle status, and view modes (Grid vs. List).</li>
        <li><strong>Search & Filter Cache:</strong> Preserves recent location, role, and salary filter selections to streamline job browsing.</li>
        <li><strong>Onboarding Progress:</strong> Tracks candidate onboarding wizard completion to prevent duplicate setup screens.</li>
      </ul>

      <h3>C. Performance & Telemetry Storage</h3>
      <p>
        Aggregates anonymized technical data to monitor system loading times, API response performance, and feature utilization.
      </p>
      <ul>
        <li><strong>API Metrics:</strong> Tracks latency and route performance to optimize backend response speeds.</li>
        <li><strong>Crash & Error Logs:</strong> Records client-side JS error telemetry to help our engineering team patch issues quickly.</li>
      </ul>

      <h2>3. SkillBridge Local Storage Registry Inventory</h2>
      <p>
        Below is a transparent inventory of key browser storage identifiers utilized by SkillBridge:
      </p>
      <ul>
        <li><code>token</code> — <em>(Essential)</em> Stores the cryptographically signed JWT session authorization token.</li>
        <li><code>user</code> — <em>(Functional)</em> Caches basic non-sensitive profile state (Name, Role, Avatar URL) for instant UI header rendering.</li>
        <li><code>theme</code> — <em>(Preference)</em> Stores user preference for Light or Dark interface display mode.</li>
        <li><code>onboarding_completed</code> — <em>(Functional)</em> Remembers wizard completion status for new candidates.</li>
      </ul>

      <h2>4. Managing & Controlling Cookies</h2>
      <p>
        You have full control over browser cookies and local storage state. Most modern browsers allow you to view, clear, or block storage through their settings menu:
      </p>
      <ul>
        <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Third-party cookies & Site Data.</li>
        <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data.</li>
        <li><strong>Apple Safari:</strong> Preferences → Privacy → Manage Website Data.</li>
        <li><strong>Microsoft Edge:</strong> Settings → Cookies and Site Permissions.</li>
      </ul>
      <p className="bg-amber-50 border-l-4 border-amber-500 p-4 text-amber-900 text-sm my-4">
        <strong>Important Note:</strong> Blocking or clearing essential storage items (such as the <code>token</code> key) will immediately log you out of your active session and require re-authentication.
      </p>

      <h2>5. Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time to reflect changes in web storage standards or legal regulations. We encourage you to review this page periodically.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        If you have questions regarding our use of cookies or local storage technologies, please contact:
      </p>
      <p>
        <strong>Email:</strong> <a href="mailto:SkillBridge684@gmail.com" className="text-indigo-600 underline">SkillBridge684@gmail.com</a><br />
        <strong>Privacy Team:</strong> SkillBridge Web Compliance Division
      </p>
    </LegalLayout>
  );
}

export default CookiePolicy;