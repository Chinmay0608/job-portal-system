import "../../Styles/pages/AiRecruiting.css";

function AiRecruiting() {
  const features = [
    {
      icon: "🤖",
      title: "Smart Candidate Matching",
      desc:
        "AI analyzes candidate skills, experience, and preferences to recommend the best matches instantly.",
    },
    {
      icon: "⚡",
      title: "Faster Hiring Process",
      desc:
        "Reduce screening time with automated resume analysis and intelligent recommendations.",
    },
    {
      icon: "📊",
      title: "Hiring Insights",
      desc:
        "Get data-driven insights on hiring trends, applicant quality, and recruiter performance.",
    },
    {
      icon: "🎯",
      title: "Precision Recruitment",
      desc:
        "Find the right talent with AI-powered filtering and role-based matching.",
    },
  ];

  return (
    <div className="ai-page">

      {/* HERO */}
      <section className="ai-hero">
        <div className="ai-hero-content">
          <span className="ai-tag">
            AI-Powered Recruitment
          </span>

          <h1>
            Smarter Hiring
            <br />
            Starts Here.
          </h1>

          <p>
            SkillBridge AI Recruiting helps recruiters
            discover the right talent faster with
            intelligent candidate recommendations,
            resume screening, and hiring insights.
          </p>

          <div className="ai-buttons">
            <button className="primary-btn">
              Try AI Recruiting
            </button>

            <button className="secondary-btn">
              Learn More
            </button>
          </div>
        </div>

        <div className="ai-hero-card">
          <h3>AI Match Score</h3>

          <div className="score-circle">
            <span>92%</span>
          </div>

          <p>
            High compatibility between role
            requirements and candidate profile.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="ai-features">
        <h2>Why Use AI Recruiting?</h2>

        <div className="ai-grid">
          {features.map((feature, index) => (
            <div className="ai-card" key={index}>
              <span className="ai-icon">
                {feature.icon}
              </span>

              <h3>{feature.title}</h3>

              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="ai-process">
        <h2>How It Works</h2>

        <div className="process-grid">

          <div className="process-card">
            <span>1</span>
            <h3>Post a Job</h3>
            <p>
              Recruiters create job openings
              with role requirements.
            </p>
          </div>

          <div className="process-card">
            <span>2</span>
            <h3>AI Screening</h3>
            <p>
              AI analyzes resumes and ranks
              the best-fit candidates.
            </p>
          </div>

          <div className="process-card">
            <span>3</span>
            <h3>Hire Faster</h3>
            <p>
              Shortlist, interview, and hire
              with confidence.
            </p>
          </div>

        </div>
      </section>

      {/* STATS */}
      <section className="ai-stats">

        <div className="stat-card">
          <h2>80%</h2>
          <p>Faster Screening</p>
        </div>

        <div className="stat-card">
          <h2>3x</h2>
          <p>Better Candidate Match</p>
        </div>

        <div className="stat-card">
          <h2>50K+</h2>
          <p>Successful Matches</p>
        </div>

      </section>

      {/* CTA */}
      <section className="ai-cta">
        <h2>
          Let AI Find the Perfect Candidate
        </h2>

        <p>
          Save time, improve hiring quality,
          and recruit smarter with SkillBridge AI.
        </p>

        <button>
          Start Recruiting
        </button>
      </section>
    </div>
  );
}

export default AiRecruiting;