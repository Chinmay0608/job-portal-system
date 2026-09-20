import LegalLayout from "../../Components/LegalLayout";

function CookiePolicy() {
  return (
    <LegalLayout title="Cookie & Storage Policy">
      <p className="effective-date">
        Effective Date: September 20, 2026 | Version 2.0
      </p>

      <p>
        SkillBridge ("we," "our," or "us") uses cookies, local web storage (HTML5 `localStorage` and `sessionStorage`), and similar tracking technologies to deliver a secure, responsive, and personalized experience for candidates and corporate recruiters. This Cookie Policy explains what these technologies are, why we deploy them, and how you can control their usage.
      </p>

      <h2>1. What Are Cookies and Local Web Storage?</h2>
      <p>
        <strong>Cookies:</strong> Cookies are small text files dropped onto your device (computer, tablet, or mobile phone) by your web browser when you visit a web application. They allow websites to remember your device, maintain active login sessions, and store user preferences over time.
      </p>
      <p>
        <strong>Local Web Storage (HTML5):</strong> Modern browser web storage mechanisms (`localStorage` and `sessionStorage`) allow application data to be cached directly in your browser. Unlike traditional cookies, local web storage offers higher storage capacity and data is not transmitted with every HTTP server request, enhancing client-side performance.
      </p>

      <h2>2. Categories of Storage & Tracking Technologies We Deploy</h2>
      <p>
        We organize our browser storage usage into three primary functional categories:
      </p>

      <h3>A. Strictly Necessary & Essential Security Storage</h3>
      <p>
        These items are vital for the operation of SkillBridge. They enable core functionalities such as user authentication, session security, fraud prevention, and role-based route access controls. Disabling these will prevent you from logging in or using candidate and recruiter dashboards.
      </p>
      <ul>
        <li><strong>Session Tokens (`token`):</strong> Cryptographically signed authentication tokens that verify your identity upon login and maintain your active session across pages.</li>
        <li><strong>User Profile Cache (`user`):</strong> Stores your basic account role (Candidate, Recruiter, Admin) and email to ensure instant client-side authorization routing.</li>
        <li><strong>Security & CSRF Tokens:</strong> Defends forms and API submissions against Cross-Site Request Forgery (CSRF) and unauthorized access attempts.</li>
      </ul>

      <h3>B. Functional & Preference Storage</h3>
      <p>
        Functional storage allows SkillBridge to remember your custom display preferences and workspace choices, delivering a personalized user experience.
      </p>
      <ul>
        <li><strong>Workspace Display Modes:</strong> Remembers your preferred view layout (Grid View vs. List View) on candidate and recruiter job management screens.</li>
        <li><strong>Filter & Search Parameters:</strong> Temporarily retains applied job search parameters (e.g., location, experience level, salary range, employment type) for quick navigation.</li>
        <li><strong>Onboarding Wizard State:</strong> Tracks progress through profile setup and onboarding steps so you are not prompted repeatedly.</li>
      </ul>

      <h3>C. Performance & Telemetry Analytics</h3>
      <p>
        These technologies aggregate anonymized operational metrics to help our engineering team measure application speed, optimize database query response times, and identify software bugs.
      </p>
      <ul>
        <li><strong>Performance Metrics:</strong> Tracks client-side page load speeds and API request latency to maintain high system availability.</li>
        <li><strong>Error & Crash Diagnostics:</strong> Log telemetry generated during runtime errors to facilitate rapid bug resolution.</li>
      </ul>

      <h2>3. Specific Browser Storage Inventory</h2>
      <p>
        Below is an overview of key local storage items utilized within the SkillBridge client application:
      </p>
      <div className="overflow-x-auto my-4">
        <table className="w-full text-left text-sm border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <th className="p-3 border-r border-slate-200">Key Name</th>
              <th className="p-3 border-r border-slate-200">Type</th>
              <th className="p-3 border-r border-slate-200">Category</th>
              <th className="p-3">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            <tr>
              <td className="p-3 border-r border-slate-200 font-mono text-xs">token</td>
              <td className="p-3 border-r border-slate-200">localStorage / Cookie</td>
              <td className="p-3 border-r border-slate-200 font-medium text-emerald-700">Essential</td>
              <td className="p-3">Stores encrypted JWT authentication credential for account authorization.</td>
            </tr>
            <tr>
              <td className="p-3 border-r border-slate-200 font-mono text-xs">user</td>
              <td className="p-3 border-r border-slate-200">localStorage</td>
              <td className="p-3 border-r border-slate-200 font-medium text-emerald-700">Essential</td>
              <td className="p-3">Caches current user identity, avatar, and role boundaries.</td>
            </tr>
            <tr>
              <td className="p-3 border-r border-slate-200 font-mono text-xs">cookie_consent</td>
              <td className="p-3 border-r border-slate-200">localStorage</td>
              <td className="p-3 border-r border-slate-200 font-medium text-blue-700">Functional</td>
              <td className="p-3">Records acknowledgment of cookie and privacy policy preferences.</td>
            </tr>
            <tr>
              <td className="p-3 border-r border-slate-200 font-mono text-xs">viewMode</td>
              <td className="p-3 border-r border-slate-200">sessionStorage</td>
              <td className="p-3 border-r border-slate-200 font-medium text-blue-700">Functional</td>
              <td className="p-3">Remembers dashboard grid vs list layout preference during session.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Managing and Disabling Cookies</h2>
      <p>
        You have complete control over local data storage. Most web browsers allow you to manage, block, or clear cookies and local web storage through their settings menu:
      </p>
      <ul>
        <li><strong>Google Chrome:</strong> Settings &gt; Privacy and security &gt; Third-party cookies & / Site settings.</li>
        <li><strong>Mozilla Firefox:</strong> Options &gt; Privacy & Security &gt; Cookies and Site Data.</li>
        <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data.</li>
        <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions.</li>
      </ul>
      <p className="mt-3">
        <em>Please Note: If you choose to clear or block essential storage items (such as `token` or `user`), active user sessions will terminate and you will be required to log in again to access candidate or recruiter features.</em>
      </p>

      <h2>5. Updates to This Cookie Policy</h2>
      <p>
        We may update this Cookie Policy from time to time to align with technical modifications or regulatory changes. The "Effective Date" at the top of this page indicates when the latest revision took effect.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        If you have questions regarding our use of cookies or local browser storage, please reach out to our technical team:
      </p>
      <p>
        <strong>Privacy & Technical Support:</strong> <a href="mailto:SkillBridge684@gmail.com" className="text-blue-600 hover:underline">SkillBridge684@gmail.com</a>
      </p>
    </LegalLayout>
  );
}

export default CookiePolicy;