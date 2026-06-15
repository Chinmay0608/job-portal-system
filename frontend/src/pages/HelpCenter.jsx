import "../Styles/pages/HelpCenter.css";

function HelpCenter() {
  const faqs = [
    {
      question: "How do I apply for jobs?",
      answer:
        "Create your profile, upload your resume, and click the apply button on any available job posting.",
    },
    {
      question: "How can recruiters post jobs?",
      answer:
        "Recruiters can register an employer account and access the recruiter dashboard to post job openings.",
    },
    {
      question: "I forgot my password. What should I do?",
      answer:
        "Use the Forgot Password option on the login page to reset your password securely.",
    },
    {
      question: "How do I update my profile?",
      answer:
        "Go to your Profile page and edit your personal details, skills, and resume anytime.",
    },
  ];

  return (
    <div className="help-page">

      {/* HERO */}
      <section className="help-hero">
        <span className="help-tag">
          Help Center
        </span>

        <h1>
          How Can We
          <br />
          Help You?
        </h1>

        <p>
          Find answers, troubleshoot problems,
          and get support for SkillBridge.
        </p>

        <div className="help-search">
          <input
            type="text"
            placeholder="Search help articles..."
          />
          <button>Search</button>
        </div>
      </section>

      {/* HELP CARDS */}
      <section className="support-section">
        <h2>Popular Support Topics</h2>

        <div className="support-grid">

          <div className="support-card">
            <span>💼</span>
            <h3>Job Applications</h3>
            <p>
              Learn how to apply for jobs,
              track applications, and get noticed.
            </p>
          </div>

          <div className="support-card">
            <span>👤</span>
            <h3>Account & Profile</h3>
            <p>
              Manage account settings,
              resumes, and personal details.
            </p>
          </div>

          <div className="support-card">
            <span>🏢</span>
            <h3>Recruiter Support</h3>
            <p>
              Learn how recruiters post jobs,
              manage applicants, and hire talent.
            </p>
          </div>

          <div className="support-card">
            <span>🔐</span>
            <h3>Security & Privacy</h3>
            <p>
              Learn about password recovery,
              privacy, and account safety.
            </p>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div className="faq-card" key={index}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-support">
        <h2>Still Need Help?</h2>

        <p>
          Our support team is here to help you.
          Reach out anytime for assistance.
        </p>

        <div className="contact-box">
          <p>
            <strong>Email:</strong>{" "}
            support@skillbridge.com
          </p>

          <p>
            <strong>Phone:</strong>{" "}
            +91 98765 43210
          </p>
        </div>

        <button>
          Contact Support
        </button>
      </section>

    </div>
  );
}

export default HelpCenter;