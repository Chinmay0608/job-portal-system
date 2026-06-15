import "../Styles/pages/Blog.css";
import { useNavigate } from "react-router-dom";

function Blog() {
  const navigate = useNavigate();
  const featuredArticles = [
    {
      title: "Top 10 Skills Recruiters Want in 2026",
      category: "Career Tips",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000",
    },
    {
      title: "How Startups Hire Freshers in Today’s Market",
      category: "Startup Hiring",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000",
    },
    {
      title: "Resume Mistakes That Cost You Interviews",
      category: "Resume Guide",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000",
    },
    {
      title: "Cracking Technical Interviews at Product Companies",
      category: "Interview Prep",
      image:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1000",
    },
  ];

  const industries = [
    "Frontend",
    "Backend",
    "AI/ML",
    "Cyber Security",
    "Cloud",
    "Data Science",
    "UI/UX",
    "Mobile Dev",
    "DevOps",
    "Blockchain",
  ];

  return (
    <div className="blog-page">

      {/* HERO */}
      <section className="blog-hero">
        <h1>Explore Career Insights</h1>

        <p>
          Startup stories, hiring trends, interview tips,
          and career guidance for the next generation of builders.
        </p>

        <div className="blog-tabs">
          <button className="active">All</button>
          <button>Career Tips</button>
          <button>Tech</button>
          <button>Startups</button>
          <button>Interview Prep</button>
          <button>Success Stories</button>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter-banner">
        <div className="newsletter-content">
          <span className="newsletter-tag">
            WEEKLY CAREER DIGEST
          </span>

          <h2>
            Hiring trends, startup stories,
            career tips & tech updates —
            delivered weekly.
          </h2>

          <button>Subscribe Now</button>
        </div>
      </section>

      {/* FEATURED ARTICLES */}
      <section className="featured-section">
        <div className="section-heading">
          <h2>Featured Articles</h2>
        </div>

        <div className="articles-grid">
          {featuredArticles.map((article, index) => (
            <div className="article-card" key={index}>
              <img src={article.image} alt={article.title} />

              <div className="article-content">
                <span>{article.category}</span>

                <h3>{article.title}</h3>

                <button>Read Article →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* INDUSTRIES */}
      <section className="industries-section">
        <h2>Discover Industries</h2>

        <div className="industry-grid">
          {industries.map((industry, index) => (
            <div className="industry-pill" key={index}>
              {industry}
            </div>
          ))}
        </div>
      </section>

            {/* FEATURED LISTS */}
      <section className="featured-lists">
        <div className="section-heading">
          <h2>Featured Lists</h2>
        </div>

        <div className="lists-grid">
          <div className="list-card">
            <img
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1000"
              alt=""
            />
            <h3>Top Companies Hiring Freshers</h3>
            <p>Explore companies actively hiring entry-level talent.</p>
          </div>

          <div className="list-card">
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1000"
              alt=""
            />
            <h3>Best Remote Tech Jobs</h3>
            <p>Find flexible opportunities across startups & tech.</p>
          </div>

          <div className="list-card">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000"
              alt=""
            />
            <h3>Fastest Growing Startups</h3>
            <p>Join innovative startups building the future.</p>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="success-section">
        <div className="section-heading">
          <h2>Success Stories</h2>
        </div>

        <div className="stories-grid">
          <div className="story-card">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43d?w=1000"
              alt=""
            />
            <h3>From Intern to Software Engineer</h3>
            <p>
              How one student landed a product company role
              after months of preparation.
            </p>
          </div>

          <div className="story-card">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1000"
              alt=""
            />
            <h3>Cracking Startup Interviews</h3>
            <p>
              A fresher’s journey from rejection to multiple offers.
            </p>
          </div>

          <div className="story-card">
            <img
              src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1000"
              alt=""
            />
            <h3>Tier-3 College to Dream Job</h3>
            <p>
              Real experiences and strategies that actually worked.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="blog-cta">
        <h2>
          Thousands of opportunities are waiting for you.
        </h2>

        <p>
          Find the right role, build your profile,
          and grow your career with SkillBridge.
        </p>

        <button>Explore Jobs</button>
      </section>

      {/* RESOURCES */}
      <section className="blog-resources">
        <button>Career Resources ⌄</button>
        <button>Remote Jobs ⌄</button>
        <button>Jobs by Skill ⌄</button>
        <button>Jobs by Role ⌄</button>
        <button>Interview Resources ⌄</button>
      </section>
    </div>
  );
}

export default Blog;