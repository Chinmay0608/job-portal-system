import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBriefcase,
  FaMapMarkerAlt,
  FaLaptopCode,
  FaBuilding,
} from "react-icons/fa";
import "../../Styles/pages/marketing/SalaryData.css";

function SalaryData() {
  const navigate = useNavigate();

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

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSalaries, setFilteredSalaries] = useState(salaries);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredSalaries(salaries);
      return;
    }

    const results = salaries.filter((item) =>
      item.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredSalaries(results);
  };

  const insights = [
    {
      icon: <FaBriefcase />,
      title: "Experience",
      description:
        "Professionals with more experience typically earn higher salaries due to their expertise and industry knowledge.",
    },
    {
      icon: <FaMapMarkerAlt />,
      title: "Location",
      description:
        "Compensation varies depending on the city, country, cost of living, and whether the role is remote or on-site.",
    },
    {
      icon: <FaLaptopCode />,
      title: "Skills",
      description:
        "Specialized skills such as AI, Cloud, Cyber Security, and Full Stack Development often command premium salaries.",
    },
    {
      icon: <FaBuilding />,
      title: "Company Type",
      description:
        "Startups, product companies, and enterprises have different compensation structures.",
    },
  ];

  return (
    <div className="salary-page">
      {/* HERO */}
      <section className="salary-hero">
        <span className="salary-tag">Salary Insights</span>

        <h1>
          Know Your
          <br />
          Market Worth.
        </h1>

        <p>
          Explore salary trends across industries, job roles, and experience
          levels to better understand your earning potential and negotiate with
          confidence.
        </p>

        <div className="salary-search">
          <input
            type="text"
            placeholder="Search role (e.g. Frontend Developer)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button onClick={handleSearch}>
            Search
          </button>
        </div>
      </section>

      {/* SALARY SECTION */}
      <section className="salary-section">
        <div className="salary-header">
          <h2>Popular Salary Ranges</h2>

          <p>
            Estimated annual salary ranges based on current hiring trends and
            industry benchmarks.
          </p>
        </div>

        <div className="salary-grid">
          {filteredSalaries.length > 0 ? (
            filteredSalaries.map((item, index) => (
              <div className="salary-card" key={index}>
                <div className="salary-role">
                  <h3>{item.role}</h3>
                  <span>{item.experience}</span>
                </div>

                <div className="salary-range">
                  {item.salary}
                </div>
              </div>
            ))
          ) : (
            <div className="salary-no-result">
              <h3>No Salary Data Found</h3>
              <p>
                We couldn't find salary information for
                <strong> "{searchTerm}"</strong>.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="salary-insights">
        <h2>What Impacts Salary?</h2>

        <div className="insight-grid">
          {insights.map((item, index) => (
            <div className="insight-card" key={index}>
              <div className="insight-icon">
                {item.icon}
              </div>

              <h3>{item.title}</h3>

              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="salary-cta">
        <h2>Ready to Earn More?</h2>

        <p>
          Discover opportunities that match your skills, experience, and salary
          expectations on SkillBridge.
        </p>

        <button onClick={() => navigate("/candidate-dashboard")}>
          Explore Jobs
        </button>
      </section>
    </div>
  );
}

export default SalaryData;