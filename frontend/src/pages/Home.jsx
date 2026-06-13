import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const marqueeRef = useRef(null);

  const tags = [
    "Frontend", "Backend", "Full Stack", "AI / ML", "React", "Node.js",
    "Cyber Security", "Flutter", "DevOps", "Blockchain", "UI/UX", "Cloud",
    "Data Science", "Python", "TypeScript", "Go", "Rust", "Web3",
  ];

  const companies = [
    { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
    { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
    { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
    { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
    { name: "Meta", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png" },
    { name: "Adobe", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg" },
    { name: "Stripe", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
    { name: "Airbnb", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg" },
  ];

  const seekerFeatures = [
    { icon: "🔗", text: "Connect directly with founders and hiring managers — no middlemen." },
    { icon: "💰", text: "See salary and equity upfront before you apply." },
    { icon: "⚡", text: "One profile, one click to apply. No cover letters needed." },
    { icon: "🌟", text: "Exclusive roles at startups you can't find anywhere else." },
  ];

  const recruiterFeatures = [
    { icon: "🎯", text: "Tap into a community of 10M+ startup-ready candidates." },
    { icon: "🛠️", text: "Set up job posts and company branding in under 10 minutes." },
    { icon: "📋", text: "Free ATS built-in, or plug into the one you already use." },
    { icon: "🤖", text: "AI-powered sourcing scans 500M+ profiles and fills your calendar." },
  ];

  const testimonials = [
    { quote: "I got my tech job on SkillBridge and never looked back. Best decision of my career.", role: "Software Engineer at a Series B startup" },
    { quote: "The UI is clean, the jobs are real, and I found my current role entirely through the platform.", role: "Product Designer at a fintech startup" },
    { quote: "Half the offers I extend are sourced here. It's the best product for startup talent bar none.", role: "Head of Talent at a YC startup" },
    { quote: "I can't imagine recruiting without SkillBridge. It's that embedded in my workflow.", role: "Founder & CEO, 50-person startup" },
  ];

  return (
    <div className="landing-page">

      {/* NAV */}
      <nav className="sb-nav">
        <div className="sb-nav-inner">
          <span className="sb-logo">SkillBridge</span>
          <div className="sb-nav-links">
            <a href="#categories">Browse Jobs</a>
            <a href="#why">For Companies</a>
            <a href="#cta">Pricing</a>
          </div>
          <div className="sb-nav-actions">
            <button className="nav-login-btn" onClick={() => navigate("/login")}>Log In</button>
            <button className="nav-signup-btn" onClick={() => navigate("/register")}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-eyebrow">130,000+ open roles · Updated daily</p>
          <h1 className="hero-title">
            Where startups and<br />job seekers <span>connect</span>
          </h1>
          <p className="hero-subtitle">
            Apply privately to thousands of tech jobs with one profile. See salary and equity upfront.
          </p>

          <div className="hero-cta-row">
            <div className="hero-cta-card" onClick={() => navigate("/register")}>
              <span className="cta-card-label">For Job Seekers</span>
              <p className="cta-card-desc">Browse 130K+ jobs at startups you'll love</p>
              <button className="cta-card-btn seeker-btn">Find your next job →</button>
            </div>
            <div className="hero-cta-divider">or</div>
            <div className="hero-cta-card" onClick={() => navigate("/register")}>
              <span className="cta-card-label">For Companies</span>
              <p className="cta-card-desc">Reach 10M+ startup-ready candidates</p>
              <button className="cta-card-btn recruiter-btn">Find your next hire →</button>
            </div>
          </div>
        </div>
      </section>

      {/* SCROLLING MARQUEE */}
      <div className="marquee-wrapper">
        <div className="marquee-track" ref={marqueeRef}>
          {[...tags, ...tags].map((tag, i) => (
            <span key={i} className="marquee-tag">{tag}</span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="stats-section">
        <div className="stats-row">
          <div className="stat-item">
            <h2>10M+</h2>
            <p>Startup-ready candidates</p>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <h2>130K+</h2>
            <p>Active tech jobs</p>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <h2>8M+</h2>
            <p>Matches made</p>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <h2>50K+</h2>
            <p>Companies hiring</p>
          </div>
        </div>

        {/* Logo strip */}
        <p className="logos-label">Candidates placed at companies like</p>
        <div className="logos-strip">
          {companies.map((c) => (
            <div className="logo-item" key={c.name}>
              <img src={c.logo} alt={c.name} />
            </div>
          ))}
        </div>
      </section>

      {/* DUAL FEATURE SECTION */}
      <section className="dual-section" id="why">
        {/* Job Seekers */}
        <div className="dual-panel seeker-panel">
          <div className="dual-panel-inner">
            <span className="panel-eyebrow">Got talent?</span>
            <h2 className="panel-title">Why job seekers love us</h2>
            <div className="feature-list">
              {seekerFeatures.map((f, i) => (
                <div className="feature-item" key={i}>
                  <span className="feature-icon">{f.icon}</span>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
            <div className="panel-actions">
              <button className="panel-primary-btn" onClick={() => navigate("/register")}>Sign up free</button>
              <button className="panel-ghost-btn" onClick={() => navigate("/login")}>Learn more →</button>
            </div>
          </div>
        </div>

        {/* Recruiters */}
        <div className="dual-panel recruiter-panel">
          <div className="dual-panel-inner">
            <span className="panel-eyebrow">Need talent?</span>
            <h2 className="panel-title">Why recruiters love us</h2>
            <div className="feature-list">
              {recruiterFeatures.map((f, i) => (
                <div className="feature-item" key={i}>
                  <span className="feature-icon">{f.icon}</span>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
            <div className="panel-actions">
              <button className="panel-primary-btn dark-btn" onClick={() => navigate("/register")}>Post a job free</button>
              <button className="panel-ghost-btn dark-ghost" onClick={() => navigate("/login")}>See pricing →</button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="categories-section" id="categories">
        <div className="section-header">
          <span className="section-badge">Browse by category</span>
          <h2 className="section-title">Find work in your field</h2>
          <p className="section-subtitle">Thousands of open roles across every tech discipline.</p>
        </div>
        <div className="categories-grid">
          {[
            { icon: "⚛️", title: "Frontend", desc: "React, Angular, Vue" },
            { icon: "🖥️", title: "Backend", desc: "Node.js, Java, Python" },
            { icon: "🤖", title: "AI / ML", desc: "Machine Learning & Data Science" },
            { icon: "☁️", title: "Cloud & DevOps", desc: "AWS, Azure, Kubernetes" },
            { icon: "📱", title: "Mobile", desc: "Flutter, Android, iOS" },
            { icon: "🔐", title: "Cyber Security", desc: "Security, Networking, Infra" },
            { icon: "📊", title: "Business", desc: "Sales, Marketing, HR, Finance" },
            { icon: "🎨", title: "Design", desc: "UI/UX, Product, Creative" },
          ].map((cat) => (
            <div className="category-card" key={cat.title} onClick={() => navigate("/login")}>
              <span className="cat-icon">{cat.icon}</span>
              <h3>{cat.title}</h3>
              <p>{cat.desc}</p>
              <span className="cat-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="section-header">
          <span className="section-badge">From our users</span>
          <h2 className="section-title">People find what they're looking for</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div className="testimonial-card" key={i}>
              <p className="testimonial-quote">"{t.quote}"</p>
              <span className="testimonial-role">{t.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="cta">
        <div className="cta-card">
          <p className="cta-eyebrow">Join 10M+ candidates and 50K+ companies</p>
          <h2>Ready to find what's next?</h2>
          <p>Your next opportunity is one profile away.</p>
          <div className="cta-actions">
            <button className="cta-btn-primary" onClick={() => navigate("/register")}>Get started — it's free</button>
            <button className="cta-btn-ghost" onClick={() => navigate("/login")}>Already have an account?</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">SkillBridge</span>
            <p>Connecting talent and opportunity since 2024.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>For Candidates</h4>
              <a href="#">Browse Jobs</a>
              <a href="#">Remote Jobs</a>
              <a href="#">Salary Data</a>
              <a href="#">Get Featured</a>
            </div>
            <div className="footer-col">
              <h4>For Companies</h4>
              <a href="#">Post a Job</a>
              <a href="#">AI Recruiting</a>
              <a href="#">Pricing</a>
              <a href="#">Customers</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Help Center</a>
              <a href="#">Privacy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 SkillBridge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;