import LegalLayout from "../../Components/LegalLayout";

function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="effective-date">
        Effective Date: September 20, 2026 | Last Updated: September 20, 2026
      </p>

      <p>
        SkillBridge ("we," "our," or "us") is committed to protecting the privacy, security, and personal data of job seekers ("Candidates"), corporate hiring managers ("Recruiters"), and visitors accessing our career platform and job aggregation services. This Privacy Policy outlines how we collect, process, store, disclose, and protect your information when you interact with SkillBridge.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect personal data to facilitate meaningful career matches, power intelligent job search tools, and deliver seamless hiring workflows.
      </p>

      <h3>A. Information You Direct Provide</h3>
      <ul>
        <li><strong>Account Registration:</strong> Name, email address, password hash, phone number, user role (Candidate or Recruiter), and profile photo.</li>
        <li><strong>Candidate Profiles & Resumes:</strong> Professional summaries, employment history, education, skill tags, desired salary range, target job titles, uploaded resume documents (PDF/DOCX), portfolio links, and social links (GitHub, LinkedIn).</li>
        <li><strong>Recruiter & Company Information:</strong> Company name, corporate website, industry sector, company size, office locations, official job descriptions, compensation ranges, and hiring stage evaluations.</li>
        <li><strong>Communications:</strong> Messages sent via our platform messaging widgets, support tickets, feedback forms, and email correspondence.</li>
      </ul>

      <h3>B. Information Collected Automatically</h3>
      <ul>
        <li><strong>Usage Telemetry:</strong> Log files, page navigation paths, job search queries, filter selections, application submission timestamps, and interaction duration.</li>
        <li><strong>Device & Technical Identifiers:</strong> IP address, browser type, operating system, device hardware parameters, language preferences, and referral URLs.</li>
        <li><strong>Authentication State:</strong> Local session tokens and cookies maintained for login authorization and workspace state preservation.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>
        We process your personal information strictly for legitimate business purposes, including:
      </p>
      <ul>
        <li><strong>Matching & Recommendations:</strong> Algorithmically matching Candidate profiles with open requisitions and delivering personalized job recommendations.</li>
        <li><strong>Application Processing:</strong> Routing candidate applications, resumes, and cover letters to recruiters when a candidate explicitly applies for a position.</li>
        <li><strong>AI-Powered Features:</strong> Utilizing artificial intelligence (AI) models to assist recruiters with job description generation and candidate resume parsing.</li>
        <li><strong>Platform Security & Fraud Prevention:</strong> Detecting fraudulent job postings, unauthorized account access, spam, and security vulnerabilities.</li>
        <li><strong>Service Updates & Customer Support:</strong> Sending transactional notifications (e.g., application status updates, security alerts, support ticket responses).</li>
      </ul>

      <h2>3. Data Sharing & Disclosure</h2>
      <p>
        SkillBridge does <strong>not</strong> sell, rent, or trade personal candidate or recruiter data to third-party data brokers. We disclose information only under the following controlled circumstances:
      </p>
      <ul>
        <li><strong>With Corporate Recruiters:</strong> When a candidate submits an application or opts into employer discoverability, their profile and resume details are shared with verified recruiters at the hiring organization.</li>
        <li><strong>Trusted Service Providers:</strong> We share data with vetted third-party vendors who perform services on our behalf (e.g., cloud hosting providers, database managers, email delivery providers, and security analytics services) bound by strict Data Processing Agreements (DPAs).</li>
        <li><strong>Public Job Aggregation:</strong> Publicly listed job requisitions posted by recruiters may be indexed by affiliated job search networks (e.g., Adzuna, JSearch, Jooble, ZipRecruiter) to maximize reach.</li>
        <li><strong>Legal & Compliance Requirements:</strong> We may disclose information if required by law, subpoena, court order, or governmental regulation, or to protect the safety, rights, or property of SkillBridge and its users.</li>
      </ul>

      <h2>4. Data Retention & Account Deletion</h2>
      <p>
        We retain your personal data for as long as your account remains active or as needed to provide you with our services. 
      </p>
      <ul>
        <li>You may request complete account deletion at any time through your Profile Settings or by contacting support.</li>
        <li>Upon receiving a verified deletion request, all personal data, resume documents, and application histories are permanently purged or anonymized within 30 days, except where retention is required by applicable tax, legal, or audit obligations.</li>
      </ul>

      <h2>5. Your Privacy Rights & Controls</h2>
      <p>
        Depending on your location (including rights under GDPR, CCPA, and applicable regional data protection laws), you possess the following rights regarding your data:
      </p>
      <ul>
        <li><strong>Right to Access & Portability:</strong> Request a copy of the personal data we hold about you in a structured, machine-readable format.</li>
        <li><strong>Right to Rectification:</strong> Update or correct inaccurate or incomplete profile information directly via account settings.</li>
        <li><strong>Right to Erasure ("Right to Be Forgotten"):</strong> Request full deletion of your personal records and application records.</li>
        <li><strong>Right to Restrict or Object:</strong> Opt-out of non-essential email notifications, promotional communications, or algorithmic candidate indexing.</li>
      </ul>

      <h2>6. International Data Transfers</h2>
      <p>
        SkillBridge operates globally with cloud infrastructure based in secure datacenters across North America and Europe. By using our platform, you consent to the transfer, storage, and processing of your information across international borders backed by Standard Contractual Clauses (SCCs).
      </p>

      <h2>7. Children's Privacy</h2>
      <p>
        SkillBridge is intended strictly for individuals who are at least 18 years of age (or the legal working age in your jurisdiction). We do not knowingly collect or solicit personal data from minors.
      </p>

      <h2>8. Updates to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy periodically to reflect changes in our services, privacy practices, or legal requirements. Material updates will be communicated via platform notifications or email prior to taking effect.
      </p>

      <h2>9. Privacy Contact Information</h2>
      <p>
        If you have questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our Data Protection Officer:
      </p>
      <p>
        <strong>Data Protection Team:</strong> <a href="mailto:SkillBridge684@gmail.com" className="text-blue-600 hover:underline">SkillBridge684@gmail.com</a>
      </p>
    </LegalLayout>
  );
}

export default PrivacyPolicy;