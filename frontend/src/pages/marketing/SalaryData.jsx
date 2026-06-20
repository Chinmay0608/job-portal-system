import "../../Styles/pages/marketing/SalaryData.css";

function SalaryData() {
  const salaries = [
    {
      role: "Frontend Developer",
      experience: "0–2 Years",
      salary: "₹5L – ₹10L",
    },
    {
      role: "Backend Developer",
      experience: "1–3 Years",
      salary: "₹6L – ₹12L",
    },
    {
      role: "AI / ML Engineer",
      experience: "2–5 Years",
      salary: "₹10L – ₹20L",
    },
    {
      role: "Cloud Engineer",
      experience: "1–4 Years",
      salary: "₹8L – ₹16L",
    },
    {
      role: "Cyber Security Analyst",
      experience: "1–4 Years",
      salary: "₹7L – ₹15L",
    },
    {
      role: "Full Stack Developer",
      experience: "2–5 Years",
      salary: "₹8L – ₹18L",
    },
  ];

  return (
    <div className="salary-page">

      {/* HERO */}
      <section className="salary-hero">
        <span className="salary-tag">
          Salary Insights
        </span>

        <h1>
          Know Your
          <br />
          Market Worth.
        </h1>

        <p>
          Explore salary trends across roles,
          industries, and experience levels to
          make informed career decisions.
        </p>

        <div className="salary-search">
          <input
            type="text"
            placeholder="Search role (e.g. Frontend Developer)"
          />

          <button>
            Search
          </button>
        </div>
      </section>

      {/* SALARY TABLE */}
      <section className="salary-section">
        <div className="salary-header">
          <h2>Popular Salary Ranges</h2>
          <p>
            Estimated salary ranges based on
            hiring trends and industry data.
          </p>
        </div>

        <div className="salary-grid">
          {salaries.map((item, index) => (
            <div className="salary-card" key={index}>

              <div className="salary-role">
                <h3>{item.role}</h3>
                <span>{item.experience}</span>
              </div>

              <div className="salary-range">
                {item.salary}
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="salary-insights">
        <h2>What Impacts Salary?</h2>

        <div className="insight-grid">

          <div className="insight-card">
            <span>💼</span>
            <h3>Experience</h3>
            <p>
              More experience often leads
              to higher compensation.
            </p>
          </div>

          <div className="insight-card">
            <span>📍</span>
            <h3>Location</h3>
            <p>
              Salaries vary by city,
              country, and remote work.
            </p>
          </div>

          <div className="insight-card">
            <span>🚀</span>
            <h3>Skills</h3>
            <p>
              High-demand skills can
              significantly boost pay.
            </p>
          </div>

          <div className="insight-card">
            <span>🏢</span>
            <h3>Company Type</h3>
            <p>
              Startups and enterprises
              offer different compensation.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="salary-cta">
        <h2>
          Find Higher Paying Opportunities
        </h2>

        <p>
          Discover jobs that match your
          expectations and career goals.
        </p>

        <button>
          Explore Jobs
        </button>
      </section>

    </div>
  );
}

export default SalaryData;