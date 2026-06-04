import "./Home.css";

function Home() {
  const tags = [
    "Frontend",
    "Backend",
    "Full Stack",
    "AI/ML",
    "React",
    "Node.js",
    "Cyber Security",
    "Flutter",
    "DevOps",
    "Blockchain",
    "UI/UX",
    "Cloud",
  ];

  return (
    <div className="landing-page">

      {/* HERO */}
      <section className="hero-section">

        {/* Floating Skills */}
        <div className="floating-wrapper">
          {tags.map((tag, index) => (
            <div
              key={index}
              className={`floating-skill skill-${index}`}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="hero-content">

          <h1 className="hero-title">
            Find your next
            <span> opportunity</span>
          </h1>

          <p className="hero-subtitle">
            Discover internships, jobs, and
            recruiters looking for talent just
            like you.
          </p>

          <div className="hero-buttons">
            <button className="hero-primary-btn">
              Find Jobs
            </button>

            <button className="hero-secondary-btn">
              Hire Talent
            </button>
          </div>

          <div className="hero-stats">

            <div>
              <h2>10K+</h2>
              <p>Jobs</p>
            </div>

            <div>
              <h2>500+</h2>
              <p>Recruiters</p>
            </div>

            <div>
              <h2>2K+</h2>
              <p>Candidates</p>
            </div>

          </div>
        </div>

      </section>

      {/* TRUST STRIP */}

      <section className="trust-section">

        <p className="trust-text">
          Trusted by candidates and recruiters worldwide
        </p>

        <div className="company-strip">
          <span>Google</span>
          <span>Microsoft</span>
          <span>Amazon</span>
          <span>Netflix</span>
          <span>Meta</span>
          <span>Adobe</span>
        </div>

      </section>

      {/* TOP CATEGORIES */}

      <section className="categories-section">

        <div className="section-header">

          <span className="section-badge">
            Popular Categories
          </span>

          <h2 className="section-title">
            Explore jobs by category
          </h2>

          <p className="section-subtitle">
            Browse opportunities across
            top tech domains.
          </p>

        </div>

        <div className="categories-grid">

          <div className="category-card">
            <span>⚛️</span>
            <h3>Frontend</h3>
            <p>React, Angular, Vue</p>
          </div>

          <div className="category-card">
            <span>🖥️</span>
            <h3>Backend</h3>
            <p>Node.js, Java, Python</p>
          </div>

          <div className="category-card">
            <span>🤖</span>
            <h3>AI / ML</h3>
            <p>Machine Learning Roles</p>
          </div>

          <div className="category-card">
            <span>☁️</span>
            <h3>Cloud</h3>
            <p>AWS, Azure, DevOps</p>
          </div>

          <div className="category-card">
            <span>📱</span>
            <h3>Mobile</h3>
            <p>Flutter, Android, iOS</p>
          </div>

          <div className="category-card">
            <span>🔐</span>
            <h3>Cyber Security</h3>
            <p>Security & Infra</p>
          </div>

        </div>

      </section>

      {/* WHY SKILLBRIDGE */}

      <section className="why-section">

        <div className="section-header">

          <span className="section-badge">
            Why SkillBridge
          </span>

          <h2 className="section-title">
            Everything you need to
            land your next role
          </h2>

          <p className="section-subtitle">
            Built for candidates and recruiters
            to connect faster and smarter.
          </p>

        </div>

        <div className="why-grid">

          <div className="why-card">
            <div className="why-icon">
              🚀
            </div>

            <h3>
              Faster Hiring
            </h3>

            <p>
              Recruiters can shortlist
              top candidates quickly
              with resumes and
              applicant tracking.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              💼
            </div>

            <h3>
              Verified Opportunities
            </h3>

            <p>
              Discover internships
              and jobs from trusted
              recruiters and companies.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">
              🤝
            </div>

            <h3>
              Better Connections
            </h3>

            <p>
              SkillBridge helps talent
              and companies find
              the right match faster.
            </p>
          </div>

        </div>

      </section>

      {/* FINAL CTA */}

      <section className="cta-section">

        <div className="cta-card">

          <h2>
            Ready to find
            your next opportunity?
          </h2>

          <p>
            Join SkillBridge and connect
            with top recruiters today.
          </p>

          <button className="cta-btn">
            Get Started
          </button>

        </div>

      </section>
    </div>
  );
}

export default Home;