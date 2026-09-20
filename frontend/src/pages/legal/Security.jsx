import LegalLayout from "../../Components/LegalLayout";

function Security() {
  return (
    <LegalLayout title="Security Overview">
      <p className="effective-date">
        Effective Date: September 20, 2026 | Version 2.4
      </p>

      <p>
        At SkillBridge, maintaining the confidentiality, integrity, and availability of our candidate and corporate recruiter data is fundamental to our platform. We employ robust, multi-layered security controls aligned with industry frameworks (including ISO/IEC 27001 standards and SOC 2 Type II compliance benchmarks) to safeguard user information across our global job aggregation and hiring infrastructure.
      </p>

      <h2>1. Infrastructure & Cloud Security</h2>
      <p>
        SkillBridge operates on tier-1 cloud infrastructure providers (Vercel, Render, AWS, and MongoDB Atlas) hosted within isolated Virtual Private Clouds (VPCs).
      </p>
      <ul>
        <li><strong>Perimeter Defense:</strong> All traffic passes through Cloudflare Web Application Firewall (WAF) with real-time DDoS mitigation, bot protection, and automated threat intelligence.</li>
        <li><strong>Network Isolation:</strong> Database clusters and internal background queue processors reside in private subnets with strict security group ingress/egress rules and zero public internet exposure.</li>
        <li><strong>System Redundancy:</strong> Distributed multi-region deployments with continuous health monitoring and automated failover capabilities ensure 99.9% uptime service availability.</li>
      </ul>

      <h2>2. Data Encryption Standards</h2>
      <p>
        We enforce end-to-end data protection measures across all communication channels and storage repositories.
      </p>
      <ul>
        <li><strong>Encryption in Transit:</strong> All HTTP communications are strictly enforced via Transport Layer Security (TLS 1.3) with HTTP Strict Transport Security (HSTS) headers enabled.</li>
        <li><strong>Encryption at Rest:</strong> Database volumes, backup archives, and candidate resume attachments are encrypted using FIPS 140-2 validated AES-256 bit encryption algorithms.</li>
        <li><strong>Credential Protection:</strong> User passwords are salted and hashed using bcrypt (work factor 12). Plaintext passwords are never logged, stored, or transmitted.</li>
      </ul>

      <h2>3. Authentication & Access Control</h2>
      <p>
        SkillBridge implements strict zero-trust identity and access management policies.
      </p>
      <ul>
        <li><strong>Role-Based Access Control (RBAC):</strong> Granular permissions enforce strict data boundaries isolating Candidate profiles, Recruiter dashboards, and Administrative controls.</li>
        <li><strong>Token Security:</strong> Session authorization utilizes cryptographically signed JSON Web Tokens (JWT) stored in HTTP-only, SameSite=Strict cookies to defend against XSS and CSRF vectors.</li>
        <li><strong>Least Privilege Access:</strong> Internal engineer access to production environments requires multi-factor authentication (MFA), hardware keys, and time-bound approval workflows.</li>
      </ul>

      <h2>4. Application Security & Resume Protection</h2>
      <p>
        Candidate resumes and application histories contain sensitive personal information that requires specialized protection protocols.
      </p>
      <ul>
        <li><strong>Document Sanitization:</strong> All uploaded files (PDF/DOCX) undergo automated anti-malware virus scanning and XSS content purification before processing.</li>
        <li><strong>Pre-Signed Secure Storage:</strong> Resume files are stored in private cloud buckets accessed exclusively through short-lived, cryptographically signed pre-signed URLs generated for authorized recruiters only.</li>
        <li><strong>Input Validation & Rate Limiting:</strong> All API endpoints enforce strict input validation schemas and rate-limiting throttling to prevent brute-force attacks and automated credential stuffing.</li>
      </ul>

      <h2>5. Continuous Vulnerability Management</h2>
      <p>
        Our security team actively identifies and remedies potential security weaknesses throughout the software development lifecycle.
      </p>
      <ul>
        <li><strong>Automated Scanning:</strong> Continuous static application security testing (SAST) and automated dependency vulnerability auditing (`npm audit`, Dependabot) run on every code commit.</li>
        <li><strong>Penetration Testing:</strong> Annual third-party penetration testing and architecture reviews are conducted by independent cybersecurity firms.</li>
      </ul>

      <h2>6. Incident Response & Data Breach Policy</h2>
      <p>
        SkillBridge maintains a formally documented Security Incident Response Plan (SIRP) led by our Security Incident Response Team (SIRT).
      </p>
      <ul>
        <li><strong>24/7 Monitoring:</strong> Real-time telemetry, centralized audit logging, and automated anomaly detection alert our security engineers to unexpected system events.</li>
        <li><strong>Timely Notification:</strong> In the event of a verified data breach impacting personal data, SkillBridge will notify affected users and regulatory bodies within 72 hours in compliance with applicable privacy laws.</li>
      </ul>

      <h2>7. Responsible Disclosure & Vulnerability Reporting</h2>
      <p>
        We welcome reports from cybersecurity researchers and ethical hackers. If you discover a potential vulnerability within the SkillBridge platform, please report it responsibly to our security team.
      </p>
      <p>
        <strong>Security Email:</strong> <a href="mailto:SkillBridge684@gmail.com" className="text-blue-600 hover:underline">SkillBridge684@gmail.com</a>
      </p>
      <p>
        Please include a detailed description of the issue, steps to reproduce, and proof-of-concept code. We request that you provide reasonable time to investigate and resolve issues prior to public disclosure.
      </p>
    </LegalLayout>
  );
}

export default Security;
