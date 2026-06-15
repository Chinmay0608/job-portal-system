import { Link } from "react-router-dom";
import "../Styles/pages/Legal.css";

function Security() {
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

        <Link to="/cookie-policy">
          Cookie Policy
        </Link>

        <Link
          to="/security"
          className="active-legal-link"
        >
          Security
        </Link>
      </aside>

      {/* Content */}
      <main className="legal-content">
        <h1>Security</h1>

        <section>
          <h2>1. Our Commitment to Security</h2>
          <p>
            At SkillBridge, protecting user data is a
            top priority. We implement industry-standard
            practices to ensure your personal information,
            resumes, applications, and recruiter activity
            remain secure.
          </p>
        </section>

        <section>
          <h2>2. Account Protection</h2>
          <p>
            Users are encouraged to create strong passwords
            and avoid sharing login credentials. SkillBridge
            uses authentication measures to help prevent
            unauthorized access to accounts.
          </p>
        </section>

        <section>
          <h2>3. Secure Data Handling</h2>
          <p>
            Sensitive information is securely processed
            and protected through encryption and secure
            storage practices wherever applicable.
          </p>
        </section>

        <section>
          <h2>4. Privacy & Confidentiality</h2>
          <p>
            Candidate profiles, resumes, recruiter details,
            and job applications are handled responsibly.
            We never sell personal user data to third parties.
          </p>
        </section>

        <section>
          <h2>5. Fraud Prevention</h2>
          <p>
            SkillBridge actively monitors suspicious activity,
            fake job listings, spam, and unauthorized access
            attempts to maintain platform trust and safety.
          </p>
        </section>

        <section>
          <h2>6. Safe Recruitment Practices</h2>
          <p>
            Recruiters are expected to post genuine job
            opportunities. Users should avoid sharing
            confidential financial information with
            unknown employers.
          </p>
        </section>

        <section>
          <h2>7. Reporting Security Issues</h2>
          <p>
            If you discover a vulnerability, suspicious
            activity, or security concern, please report
            it immediately to our support team.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>
            For security-related concerns, contact:
          </p>

          <p>
            <strong>Email:</strong> security@skillbridge.com
          </p>
        </section>

      </main>
    </div>
  );
}

export default Security;