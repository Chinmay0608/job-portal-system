import LegalLayout from "../../Components/LegalLayout";

function TermsOfUse() {
  return (
    <LegalLayout title="Terms of Use Agreement">
      <p className="effective-date">
        <strong>Last Updated:</strong> September 15, 2026 | <strong>Version:</strong> 2.8.0
      </p>

      <p>
        These Terms of Use ("Terms", "Agreement") constitute a legally binding agreement between you ("User", "Candidate", "Recruiter", or "Employer") and <strong>SkillBridge Technologies</strong> ("SkillBridge", "Company", "we", "us", or "our"). By registering an account, publishing a job requisition, submitting a candidate application, or browsing the SkillBridge platform, you agree to comply with and be bound by these Terms.
      </p>

      <h2>1. User Eligibility & Account Registration</h2>
      <p>
        To access SkillBridge services, users must meet the following eligibility requirements:
      </p>
      <ul>
        <li>You must be at least 18 years of age or the legal working age in your jurisdiction.</li>
        <li>You must provide accurate, complete, and current registration details during account creation.</li>
        <li>Recruiters and hiring managers must possess the legal authority to represent their respective company or entity.</li>
        <li>Account sharing is strictly prohibited; users are solely responsible for maintaining credential confidentiality and all activities under their account.</li>
      </ul>

      <h2>2. Candidate Obligations & Application Rules</h2>
      <p>
        SkillBridge provides candidates with job discovery, resume creation, application tracking, and AI career guidance tools. Candidates agree to:
      </p>
      <ul>
        <li><strong>Truthful Representation:</strong> Submit accurate, non-misleading information regarding work history, education, technical skills, compensation, and legal authorization to work.</li>
        <li><strong>Authentic Submissions:</strong> Apply only to genuine job requisitions for which they are personally seeking consideration. Automated application bots or spam application scripts are strictly prohibited.</li>
        <li><strong>Respectful Communication:</strong> Maintain professional, respectful conduct when communicating with recruiters and corporate talent acquisition teams.</li>
      </ul>

      <h2>3. Recruiter & Employer Posting Regulations</h2>
      <p>
        Employers and recruiters utilizing SkillBridge to advertise job openings agree to adhere to strict hiring standards:
      </p>
      <ul>
        <li><strong>Genuine Opportunities:</strong> All posted requisitions must represent actual, active, and funded employment openings. Ghost postings, multi-level marketing (MLM) schemes, pay-to-apply offers, and deceptive listings are strictly prohibited.</li>
        <li><strong>Fair Hiring Practices:</strong> Job requisitions and applicant evaluations must comply with applicable equal employment opportunity laws, free from discrimination based on race, gender, age, disability, religion, or background.</li>
        <li><strong>Compensation Disclosure:</strong> Postings should provide realistic salary ranges and accurate job location/remote work parameters.</li>
      </ul>

      <h2>4. Prohibited Platform Activities</h2>
      <p>
        Users are prohibited from engaging in activities that compromise platform security or integrity:
      </p>
      <ul>
        <li>Data scraping, automated data harvesting, or indexing user profiles without prior written consent.</li>
        <li>Transmitting malware, phishing links, spam messages, or unauthorized promotional material.</li>
        <li>Impersonating any person, candidate, corporate entity, or SkillBridge representative.</li>
        <li>Attempting to bypass security controls, rate limits, role-based authorization, or API safeguards.</li>
      </ul>

      <h2>5. AI Features & Automated Match Disclaimer</h2>
      <p>
        SkillBridge incorporates artificial intelligence algorithms to provide candidate match scoring, resume parsing, job recommendations, and AI career chat assistance (Dhruv AI):
      </p>
      <ul>
        <li><strong>Assistive Nature:</strong> AI match scores and recommendations are provided for informational and preliminary evaluation purposes only.</li>
        <li><strong>No Employment Guarantee:</strong> SkillBridge does not guarantee candidate selection, interview invitations, job placement, or hiring outcomes for candidates or employers.</li>
        <li><strong>Human Oversight:</strong> Final recruitment decisions, shortlisting, and hiring selections rest entirely with individual recruiters and corporate employers.</li>
      </ul>

      <h2>6. Intellectual Property & User Content License</h2>
      <p>
        SkillBridge retains all proprietary rights, trademarks, source code, and design assets associated with the platform.
      </p>
      <ul>
        <li><strong>User Content Ownership:</strong> Candidates and recruiters retain full ownership of their submitted resumes, logos, and job descriptions.</li>
        <li><strong>Platform License Grant:</strong> By uploading content to SkillBridge, you grant us a worldwide, non-exclusive, royalty-free license to host, display, index, format, and render your content strictly for the operational purpose of executing recruitment services.</li>
      </ul>

      <h2>7. Disclaimers & Limitation of Liability</h2>
      <p>
        SkillBridge is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied.
      </p>
      <ul>
        <li>SkillBridge is not an employment agency and is not a party to any employment contract between candidates and recruiters.</li>
        <li>In no event shall SkillBridge be liable for indirect, incidental, consequential, or punitive damages arising from platform downtime, missed employment opportunities, wage disputes, or third-party communications.</li>
      </ul>

      <h2>8. Account Termination & Suspension</h2>
      <p>
        SkillBridge reserves the right to suspend, disable, or permanently terminate accounts that violate these Terms, engage in fraudulent listings, or compromise system security, with or without prior notice.
      </p>

      <h2>9. Governing Law & Dispute Resolution</h2>
      <p>
        These Terms shall be governed by and construed in accordance with applicable state and national laws. Any legal disputes arising under these Terms shall be resolved through binding arbitration or competent courts.
      </p>

      <h2>10. Contact Information</h2>
      <p>
        For inquiries or legal notices regarding these Terms of Use, please contact:
      </p>
      <p>
        <strong>Legal Department:</strong> <a href="mailto:SkillBridge684@gmail.com" className="text-indigo-600 underline">SkillBridge684@gmail.com</a><br />
        <strong>Support Center:</strong> SkillBridge Help & Legal Resolution Division
      </p>
    </LegalLayout>
  );
}

export default TermsOfUse;