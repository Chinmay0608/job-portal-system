import "../Styles/pages/Careers.css";

function Careers() {
  const openings = [
    {
      role: "Frontend Developer",
      type: "Full Time",
      location: "Remote",
      desc: "Build modern and scalable user interfaces using React.",
    },
    {
      role: "Backend Developer",
      type: "Full Time",
      location: "Bangalore, India",
      desc: "Work on APIs, databases, and scalable backend systems.",
    },
    {
      role: "UI/UX Designer",
      type: "Internship",
      location: "Remote",
      desc: "Design intuitive and visually appealing user experiences.",
    },
    {
      role: "AI/ML Engineer",
      type: "Full Time",
      location: "Hybrid",
      desc: "Help improve AI-powered recruitment systems.",
    },
  ];

  return (
    <div className="careers-page">

      {/* HERO */}
      <section className="careers-hero">
        <span className="careers-tag">
          Join Our Team
        </span>

        <h1>
          Build The Future
          <br />
          Of Hiring.
        </h1>

        <p>
          At SkillBridge, we’re building tools that connect
          talented people with incredible opportunities.
          Join us and help shape the future of recruitment.
        </p>

        <button className="careers-btn">
          View Open Positions
        </button>
      </section>

      {/* WHY JOIN */}
      <section className="why-join-section">
        <h2>Why Work With Us?</h2>

        <div className="benefits-grid">

          <div className="benefit-card">
            <span>🌍</span>
            <h3>Remote Friendly</h3>
            <p>
              Flexible work culture with hybrid
              and remote opportunities.
            </p>
          </div>

          <div className="benefit-card">
            <span>🚀</span>
            <h3>Growth Focused</h3>
            <p>
              Learn, experiment, and grow
              alongside passionate builders.
            </p>
          </div>

          <div className="benefit-card">
            <span>💡</span>
            <h3>Innovation Driven</h3>
            <p>
              Work on meaningful products
              shaping the hiring ecosystem.
            </p>
          </div>

          <div className="benefit-card">
            <span>🤝</span>
            <h3>Collaborative Culture</h3>
            <p>
              Be part of a team that values
              ownership and teamwork.
            </p>
          </div>

        </div>
      </section>

      {/* JOB OPENINGS */}
      <section className="openings-section">
        <h2>Current Openings</h2>

        <div className="openings-grid">
          {openings.map((job, index) => (
            <div className="job-card" key={index}>

              <div className="job-top">
                <h3>{job.role}</h3>

                <span className="job-type">
                  {job.type}
                </span>
              </div>

              <p className="job-location">
                📍 {job.location}
              </p>

              <p className="job-desc">
                {job.desc}
              </p>

              <button className="apply-btn">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CULTURE */}
      <section className="culture-section">
        <h2>Our Culture</h2>

        <p>
          We believe in transparency, ownership,
          curiosity, and continuous learning.
          Whether you're an engineer, designer,
          recruiter, or strategist — your ideas matter.
        </p>
      </section>

      {/* CTA */}
      <section className="careers-cta">
        <h2>
          Don’t See Your Role?
        </h2>

        <p>
          We’re always looking for talented people.
          Send us your profile and let’s talk.
        </p>

        <button>
          Contact Us
        </button>
      </section>

    </div>
  );
}

export default Careers;