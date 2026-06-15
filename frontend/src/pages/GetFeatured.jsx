import "../Styles/pages/GetFeatured.css";

function GetFeatured() {
  const benefits = [
    {
      icon: "🚀",
      title: "Get Noticed Faster",
      desc:
        "Appear at the top of recruiter searches and increase profile visibility.",
    },
    {
      icon: "💼",
      title: "Direct Recruiter Access",
      desc:
        "Let top companies discover your profile without waiting for applications.",
    },
    {
      icon: "⚡",
      title: "Priority Recommendations",
      desc:
        "Receive better job matches tailored to your skills and preferences.",
    },
    {
      icon: "🌍",
      title: "More Opportunities",
      desc:
        "Unlock access to exclusive jobs and hiring networks.",
    },
  ];

  return (
    <div className="featured-page">

      {/* HERO */}
      <section className="featured-hero">
        <span className="featured-tag">
          Get Featured
        </span>

        <h1>
          Stand Out To
          <br />
          Top Recruiters
        </h1>

        <p>
          Boost your visibility, get discovered by recruiters,
          and unlock premium career opportunities with
          SkillBridge Featured Profiles.
        </p>

        <button className="featured-btn">
          Get Featured Today
        </button>
      </section>

      {/* BENEFITS */}
      <section className="benefits-section">
        <h2>Why Get Featured?</h2>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div className="benefit-card" key={index}>
              <span className="benefit-icon">
                {benefit.icon}
              </span>

              <h3>{benefit.title}</h3>

              <p>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="featured-process">
        <h2>How It Works</h2>

        <div className="process-grid">

          <div className="process-card">
            <span>1</span>
            <h3>Complete Your Profile</h3>
            <p>
              Add your skills, resume, projects,
              and achievements.
            </p>
          </div>

          <div className="process-card">
            <span>2</span>
            <h3>Enable Featured Mode</h3>
            <p>
              Activate profile boosting to gain
              recruiter attention.
            </p>
          </div>

          <div className="process-card">
            <span>3</span>
            <h3>Get Hired Faster</h3>
            <p>
              Receive recruiter views, messages,
              and job opportunities.
            </p>
          </div>

        </div>
      </section>

      {/* STATS */}
      <section className="featured-stats">

        <div className="stat-card">
          <h2>3x</h2>
          <p>More Recruiter Views</p>
        </div>

        <div className="stat-card">
          <h2>50K+</h2>
          <p>Featured Candidates</p>
        </div>

        <div className="stat-card">
          <h2>80%</h2>
          <p>Higher Response Rate</p>
        </div>

      </section>

      {/* CTA */}
      <section className="featured-cta">
        <h2>
          Ready To Get Discovered?
        </h2>

        <p>
          Let recruiters find you faster and unlock
          premium career opportunities.
        </p>

        <button>
          Upgrade Profile
        </button>
      </section>

    </div>
  );
}

export default GetFeatured;