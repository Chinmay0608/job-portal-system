import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Mail,
} from "lucide-react";

import featuredArticles from "./blogArticles";

function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { slug } = useParams();
  const article = featuredArticles.find((item) => item.slug === slug);

  if (slug) {
    if (!article) {
      return (
        <div className="blog-page-container article-not-found">
          <h1>Article not found</h1>
          <Link to="/blog" className="article-read-btn">Back to articles <ArrowRight size={16} /></Link>
        </div>
      );
    }

    return (
      <div className="blog-page-container">
        <article className="blog-article-detail">
          <Link to="/blog" className="article-back-link">← All articles</Link>
          <img className="blog-article-hero" src={article.image} alt="" />
          <div className="blog-article-body">
            <span className="article-category-badge">{article.category}</span>
            <div className="article-meta">{article.date} · {article.readTime}</div>
            <h1>{article.title}</h1>
            <p className="blog-article-intro">{article.excerpt}</p>
            {article.content.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.text.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
            <aside className="blog-article-sources" aria-label="Article sources">
              <h2>Sources &amp; further reading</h2>
              <ul>
                {article.sources.map((source) => (
                  <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>
                ))}
              </ul>
            </aside>
          </div>
        </article>
      </div>
    );
  }

  const categories = ["All", "Career Tips", "Startup Hiring", "Resume Guide", "Interview Prep", "Tech Insights"];

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

      {/* ARTICLES GRID */}
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
                  <span>{article.date}</span> · <span>{article.readTime}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <Link to={`/blog/${article.slug}`} className="article-read-btn">
                  Read Article <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* NEWSLETTER AT THE END OF THE PAGE */}
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
    </div>
  );
}

export default Blog;
