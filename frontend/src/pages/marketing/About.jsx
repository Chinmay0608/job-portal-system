import "../../Styles/pages/marketing/About.css";

function About() {
  return (
    <div className="about-page">
      {/* HERO: The primary layout focal point introducing the platform narrative */}
      <section className="about-hero">
        <div className="about-content">
          <span className="about-tag">About SkillBridge</span>
          <h1>Connecting Talent<br />With Opportunity.</h1>
          <p>SkillBridge is a modern job portal designed to help candidates discover meaningful career opportunities while enabling recruiters to find the right talent faster and smarter.</p>
        </div>
      </section>

      {/* MISSION & IDENTITY: Dual-column presentation splitting brand core values */}
      <section className="about-section">
        <div className="about-card">
          <h2>Our Mission</h2>
          <p>Our mission is simple — bridge the gap between skilled professionals and companies looking for exceptional talent. We believe finding jobs and hiring people should be faster, transparent, and accessible for everyone.</p>
        </div>
        <div className="about-card">
          <h2>What We Do</h2>
          <p>SkillBridge provides a seamless hiring experience through job discovery, recruiter connections, profile management, application tracking, and smart recruitment tools.</p>
        </div>
      </section>

      {/* FEATURES: Grid arrangement using emoji glyphs to anchor value propositions */}
      <section className="features-section">
        <h2>Why SkillBridge?</h2>
        <div className="features-grid">
          <div className="feature-box"><span>💼</span><h3>Career Opportunities</h3><p>Explore jobs from startups, enterprises, and recruiters across industries.</p></div>
          <div className="feature-box"><span>⚡</span><h3>Fast Hiring</h3><p>Recruiters can post jobs, manage applicants, and hire efficiently.</p></div>
          <div className="feature-box"><span>🌍</span><h3>Remote Friendly</h3><p>Discover remote and hybrid opportunities from around the world.</p></div>
          <div className="feature-box"><span>🔒</span><h3>Secure Platform</h3><p>Your data, applications, and hiring process remain secure and protected.</p></div>
        </div>
      </section>

      {/* STATS: High-impact analytical data numbers to build instant user credibility */}
      <section className="about-stats">
        <div className="stat-box"><h2>50K+</h2><p>Jobs Posted</p></div>
        <div className="stat-box"><h2>1K+</h2><p>Recruiters</p></div>
        <div className="stat-box"><h2>20K+</h2><p>Candidates</p></div>
      </section>

      {/* CTA (Call To Action): The terminal conversion zone guiding navigation behavior */}
      <section className="about-cta">
        <h2>Start Your Career Journey Today</h2>
        <p>Whether you're a candidate looking for opportunities or a recruiter searching for talent, SkillBridge is built for you.</p>
        <button>Explore Jobs</button>
      </section>
    </div>
  );
}

export default About;