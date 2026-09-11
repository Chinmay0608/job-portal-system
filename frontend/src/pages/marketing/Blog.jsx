import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Mail,
} from "lucide-react";

function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Career Tips", "Startup Hiring", "Resume Guide", "Interview Prep", "Tech Insights"];

  const featuredArticles = [
    {
      title: "Top 10 Skills Recruiters Want in 2026",
      category: "Career Tips",
      readTime: "5 min read",
      date: "Sep 8, 2026",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000",
      excerpt: "Discover the most in-demand technical, AI, and soft skills hiring managers are actively filtering for this year.",
    },
    {
      title: "How Startups Hire Freshers in Today’s Market",
      category: "Startup Hiring",
      readTime: "6 min read",
      date: "Sep 5, 2026",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000",
      excerpt: "A deep dive into founder expectations, portfolio signals, and how early-stage teams evaluate junior candidates.",
    },
    {
      title: "Resume Mistakes That Cost You Interviews",
      category: "Resume Guide",
      readTime: "4 min read",
      date: "Aug 29, 2026",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000",
      excerpt: "Avoid these critical mistakes that cause ATS filters and candidate screening tools to drop your application.",
    },
    {
      title: "Cracking Technical Interviews at Product Companies",
      category: "Interview Prep",
      readTime: "8 min read",
      date: "Aug 22, 2026",
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1000",
      excerpt: "Proven strategies for system design, live coding sessions, and behavioral interview questions.",
    },
  ];

  const filteredArticles = activeCategory === "All"
    ? featuredArticles
    : featuredArticles.filter((a) => a.category === activeCategory);

  return (
    <div className="blog-page-container">
      {/* 1. HERO */}
      <section className="blog-hero-wrapper">
        <div className="blog-hero-badge">
          <Sparkles size={16} className="badge-sparkle" />
          <span>SkillBridge Knowledge Hub</span>
        </div>

        <h1 className="blog-hero-title">
          Career Insights & <br />
          <span className="blog-title-gradient">Tech Hiring Trends</span>
        </h1>

        <p className="blog-hero-subtitle">
          Startup stories, interview breakdowns, resume guides, and career insights written by recruitment experts and engineers.
        </p>

        {/* CATEGORY TABS */}
        <div className="blog-categories-wrapper">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 2. NEWSLETTER BANNER */}
      <section className="blog-newsletter-banner">
        <div className="newsletter-card">
          <div className="newsletter-badge">
            <Mail size={16} /> WEEKLY CAREER DIGEST
          </div>
          <h2>Stay Ahead in Your Career & Hiring Journey</h2>
          <p>Get curated hiring trends, tech interview guides, and salary insights delivered directly to your inbox every Monday.</p>
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email address..." className="newsletter-input" />
            <button className="newsletter-submit-btn">Subscribe Free</button>
          </div>
        </div>
      </section>

      {/* 3. ARTICLES GRID */}
      <section className="blog-articles-section">
        <div className="section-header">
          <span className="section-kicker">Latest Content</span>
          <h2>{activeCategory === "All" ? "Featured Articles" : `${activeCategory} Articles`}</h2>
          <p>Handpicked guides and industry analysis for job seekers and hiring teams.</p>
        </div>

        <div className="articles-grid">
          {filteredArticles.map((article, index) => (
            <article className="article-card" key={index}>
              <div className="article-image-wrapper">
                <img src={article.image} alt={article.title} />
                <span className="article-category-badge">{article.category}</span>
              </div>

              <div className="article-content">
                <div className="article-meta">
                  <span>{article.date}</span> • <span>{article.readTime}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <Link to="/jobs" className="article-read-btn">
                  Read Article <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Blog;