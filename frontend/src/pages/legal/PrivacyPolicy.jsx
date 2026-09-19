import LegalLayout from "../../Components/LegalLayout";

function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="effective-date">
        <strong>Last Updated:</strong> September 15, 2026 | <strong>Version:</strong> 3.1.0
      </p>

      <p>
        Welcome to <strong>SkillBridge</strong> ("SkillBridge", "we", "our", or "us"). We respect your privacy and are committed to protecting the personal data of our candidates, recruiters, hiring managers, and site visitors. This Privacy Policy outlines how we collect, process, store, share, and protect your information when you access our career platform, mobile services, and recruitment software APIs.
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect data necessary to deliver intelligent job matching, candidate evaluation tools, and streamlined recruitment workflows.
      </p>

      <h3>A. Candidate Information</h3>
      <ul>
        <li><strong>Account Details:</strong> Full name, email address, password hash, profile avatar, and phone number.</li>
        <li><strong>Professional Profile & Resume:</strong> Educational history, work experience, skill endorsements, uploaded resume documents (PDF/Word), portfolio URLs (GitHub, LinkedIn, Personal Site), current salary, and target compensation.</li>
        <li><strong>Job Search Preferences:</strong> Desired job titles, preferred work arrangements (Remote, Onsite, Hybrid), target locations, and employment types (Full-time, Contract, Internship).</li>
        <li><strong>Application Activity:</strong> Applied jobs, saved jobs, application status history, recruiter communication logs, and interview responses.</li>
      </ul>

      <h3>B. Recruiter & Employer Information</h3>
      <ul>
        <li><strong>Corporate Account Credentials:</strong> Recruiter name, business email address, company name, corporate domain, position title, and billing information.</li>
        <li><strong>Job Requisition Data:</strong> Job titles, role descriptions, required skills, compensation ranges, office locations, and candidate evaluation criteria.</li>
        <li><strong>Candidate Evaluation Feedback:</strong> Internal notes, candidate ratings, shortlists, rejection reasons, and interview feedback.</li>
      </ul>

      <h3>C. Automated Telemetry & Usage Data</h3>
      <ul>
        <li><strong>Device & Network Identifiers:</strong> IP address, browser type, operating system, device hardware details, referral URLs, and session timestamps.</li>
        <li><strong>Platform Analytics:</strong> Clickstream telemetry, page view duration, search queries, filter selections, and feature usage patterns.</li>
      </ul>

      <h2>2. Legal Basis & How We Use Your Data</h2>
      <p>
        SkillBridge processes personal information based on contractual necessity, legitimate business interests, legal compliance, and explicit consent:
      </p>
      <ul>
        <li><strong>Facilitating Employment Connections:</strong> Connecting candidates with verified recruiters and matching candidate profiles with relevant open positions.</li>
        <li><strong>AI-Assisted Matching & Recommendations:</strong> Algorithmically processing skills, experience, and job preferences to display personalized job recommendations and AI talent candidate rankings.</li>
        <li><strong>Account Administration & Security:</strong> Authenticating logins, validating user identity, detecting fraudulent listings, and enforcing platform terms.</li>
        <li><strong>Communications & Alerts:</strong> Sending job alert notifications, application status updates, recruiter messages, and platform maintenance announcements.</li>
        <li><strong>Platform Enhancement:</strong> Analyzing aggregate user trends to optimize search performance, UI accessibility, and algorithm accuracy.</li>
      </ul>

      <h2>3. Information Sharing & Third-Party Processors</h2>
      <p>
        <strong>We do not sell personal data to third parties or advertising networks.</strong> We share information strictly under the following operational circumstances:
      </p>
      <ul>
        <li><strong>Hiring Recruiters & Employers:</strong> When a candidate explicitly applies for a job posting or opts into public recruiter discovery, their profile and resume become accessible to the relevant employer.</li>
        <li><strong>Job Board Aggregators:</strong> Public job postings published by recruiters may be indexed via API adapters (e.g., Adzuna, JSearch, Jooble, ZipRecruiter) to maximize applicant reach.</li>
        <li><strong>Infrastructure Sub-Processors:</strong> Cloud hosting, database management, transactional email delivery, and AI processing services (Vercel, Render, MongoDB Atlas, Cloudflare, Resend) under signed Data Processing Agreements (DPAs).</li>
        <li><strong>Legal & Regulatory Requirements:</strong> We may disclose data if required by law, subpoena, court order, or to protect the safety and security of our platform and users.</li>
      </ul>

      <h2>4. Data Retention & Account Deletion</h2>
      <p>
        We retain personal data only for as long as necessary to fulfill the purposes outlined in this policy or as required by applicable tax and legal mandates:
      </p>
      <ul>
        <li><strong>Active Accounts:</strong> Profile data and application history remain available as long as your account remains active.</li>
        <li><strong>Right to be Forgotten (Account Deletion):</strong> You may request full account deletion at any time through your Profile Settings or by contacting support. Upon confirmed request, your personal profile data, uploaded resumes, and application records will be permanently purged or anonymized within 30 days.</li>
      </ul>

      <h2>5. Your Privacy Rights (GDPR / CCPA / Indian IT Act)</h2>
      <p>Depending on your jurisdiction, you possess the following data rights:</p>
      <ul>
        <li><strong>Right to Access & Portability:</strong> Request a copy of all personal data held by SkillBridge in a structured, machine-readable format.</li>
        <li><strong>Right to Rectification:</strong> Update or correct inaccurate profile details directly via your candidate or recruiter dashboard.</li>
        <li><strong>Right to Object & Restrict:</strong> Opt-out of non-essential communications, AI match scoring, or recruiter profile visibility at any time.</li>
        <li><strong>Right to Erasure:</strong> Request permanent removal of your account and personal history.</li>
      </ul>

      <h2>6. International Data Transfers</h2>
      <p>
        SkillBridge operates globally. Personal data may be processed in servers located outside your home country. We ensure all cross-border data transfers adhere to recognized transfer mechanisms, including standard contractual clauses (SCCs) and encryption safeguards.
      </p>

      <h2>7. Children's Privacy</h2>
      <p>
        SkillBridge is intended strictly for individuals seeking employment or conducting corporate hiring who are at least 18 years of age (or the legal working age in their jurisdiction). We do not knowingly collect personal data from minors.
      </p>

      <h2>8. Policy Updates & Contact Information</h2>
      <p>
        We may update this Privacy Policy periodically to reflect technological or legal changes. Material updates will be highlighted via site banners or direct email notification.
      </p>
      <p>
        For privacy inquiries, exercising data rights, or contacting our Data Protection Officer:
      </p>
      <p>
        <strong>Data Protection Team:</strong> <a href="mailto:SkillBridge684@gmail.com" className="text-indigo-600 underline">SkillBridge684@gmail.com</a><br />
        <strong>Address:</strong> SkillBridge Technologies, Platform Legal & Privacy Division
      </p>
    </LegalLayout>
  );
}

export default PrivacyPolicy;