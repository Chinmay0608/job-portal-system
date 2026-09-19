import LegalLayout from "../../Components/LegalLayout";

function Security() {
  return (
    <LegalLayout title="Platform Security Overview">
      <p className="effective-date">
        <strong>Last Updated:</strong> September 15, 2026 | <strong>Version:</strong> 2.4.0
      </p>

      <p>
        At <strong>SkillBridge</strong>, maintaining robust, enterprise-grade security is foundational to our mission of connecting top candidates with industry-leading employers. We employ a multi-layered, defense-in-depth security architecture designed to safeguard user identity, resume assets, corporate recruitment pipelines, and application telemetry against unauthorized access, data loss, and emerging cyber threats.
      </p>

      <h2>1. Infrastructure & Cloud Security</h2>
      <p>
        SkillBridge infrastructure is hosted across SOC 2 Type II and ISO 27001 certified cloud environments (AWS, Vercel, Render) with isolated Virtual Private Clouds (VPCs).
      </p>
      <ul>
        <li><strong>Network Isolation:</strong> Production databases operate in private subnets with strict firewall rules and zero direct public internet accessibility.</li>
        <li><strong>Web Application Firewall (WAF):</strong> Traffic is filtered through automated WAF rules to mitigate Distributed Denial of Service (DDoS) attacks, SQL injection, cross-site scripting (XSS), and malicious bot activity.</li>
        <li><strong>Automated Rate Limiting:</strong> Sensitive API endpoints (authentication, password resets, application submissions) enforce strict rate limits to prevent brute-force attacks.</li>
      </ul>

      <h2>2. Data Encryption Standards</h2>
      <p>
        We enforce rigorous cryptographic standards across all storage nodes and communication channels:
      </p>
      <ul>
        <li><strong>Encryption in Transit:</strong> All data transmitted between clients and SkillBridge servers is encrypted using TLS 1.3 / HTTPS protocols. HTTP connections are automatically redirected to secure HTTPS.</li>
        <li><strong>Encryption at Rest:</strong> User profiles, recruitment records, and application assets stored in MongoDB Atlas and cloud object storage are encrypted using AES-256 standard encryption keys.</li>
        <li><strong>Password Protection:</strong> Account credentials are hashed using salted <code>bcrypt</code> algorithms (minimum 10 work factor rounds). SkillBridge never stores passwords in plain text.</li>
      </ul>

      <h2>3. Authentication & Access Control</h2>
      <p>
        SkillBridge implements strict identity and access management controls:
      </p>
      <ul>
        <li><strong>Token Security:</strong> User sessions rely on cryptographically signed JSON Web Tokens (JWT) with defined expiration lifespans.</li>
        <li><strong>Role-Based Access Control (RBAC):</strong> Strict authorization policies segregate Candidate, Recruiter, and System Administrator privileges. Users can only access resources explicitly permitted for their role.</li>
        <li><strong>Session Management:</strong> Changing security credentials or logging out immediately invalidates active session tokens server-side.</li>
      </ul>

      <h2>4. Resume Asset Protection</h2>
      <p>
        Candidate resumes and career portfolios represent sensitive personal data. We implement specialized safeguards for candidate documents:
      </p>
      <ul>
        <li><strong>Controlled Recruiter Visibility:</strong> Uploaded resumes are accessible only to verified hiring managers and recruiters when candidates explicitly submit an application or enable public profile visibility.</li>
        <li><strong>Secure Pre-Signed URLs:</strong> Document retrieval relies on short-lived, pre-signed S3 download URLs that expire automatically after access.</li>
        <li><strong>Malware & Type Scanning:</strong> All file uploads undergo automated MIME type validation and security inspection to prevent malicious file execution.</li>
      </ul>

      <h2>5. Vulnerability & Patch Management</h2>
      <p>
        Our engineering team enforces continuous security review cycles:
      </p>
      <ul>
        <li><strong>Automated Audits:</strong> Continuous dependency scanning (via <code>npm audit</code> and automated CI security gates) flags vulnerable third-party modules before deployment.</li>
        <li><strong>Code Reviews:</strong> All code modifications require static analysis security testing (SAST) and peer code review before entering production.</li>
        <li><strong>Input Sanitization:</strong> All user input is sanitized using DOMPurify and parameterized queries to neutralize injection risks.</li>
      </ul>

      <h2>6. Incident Response & Business Continuity</h2>
      <p>
        SkillBridge maintains a dedicated Security Incident Response Protocol (SIRP) to ensure rapid containment and transparent communication:
      </p>
      <ul>
        <li><strong>Continuous Logging & Monitoring:</strong> System activities, administrative access, and error anomalies are logged to centralized monitoring pipelines with automated alert triggers.</li>
        <li><strong>Backup & Disaster Recovery:</strong> Automated point-in-time database snapshots are taken daily and stored across geographically redundant data centers, tested regularly for rapid recovery.</li>
        <li><strong>Incident Notification:</strong> In the event of a confirmed data breach impacting user data, SkillBridge will notify affected users and relevant supervisory authorities within 72 hours in compliance with applicable law.</li>
      </ul>

      <h2>7. Responsible Vulnerability Disclosure</h2>
      <p>
        We welcome reports from security researchers and community members who identify potential vulnerabilities. If you discover a security issue, please adhere to responsible disclosure practices:
      </p>
      <ul>
        <li>Report the finding promptly to our security team before public disclosure.</li>
        <li>Avoid accessing, modifying, or deleting data belonging to other users.</li>
        <li>Do not attempt Denial of Service (DoS) attacks or social engineering against SkillBridge personnel.</li>
      </ul>

      <h2>8. Security Contact & Reporting</h2>
      <p>
        To report a security vulnerability, request a security assessment summary, or ask questions regarding our infrastructure safeguards, please contact our dedicated security team:
      </p>
      <p>
        <strong>Email:</strong> <a href="mailto:SkillBridge684@gmail.com" className="text-indigo-600 underline">SkillBridge684@gmail.com</a><br />
        <strong>Emergency Response Hours:</strong> 24/7/365
      </p>
    </LegalLayout>
  );
}

export default Security;
