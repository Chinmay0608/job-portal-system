import { useNavigate } from "react-router-dom";
import "../../Styles/pages/Home.css";
import {
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
} from "react-icons/hi";
import {
  HiUserGroup,
  HiCog,
  HiClipboardList,
  HiChip
} from "react-icons/hi";


function Home() {
  const navigate = useNavigate();

  const tags = [
    "Frontend", "Backend", "Full Stack", "AI / ML", "React", "Node.js",
    "Cyber Security", "Flutter", "DevOps", "Blockchain", "UI/UX", "Cloud",
    "Data Science", "Python", "TypeScript", "Go", "Rust", "Web3",
  ];

  const companies = [
    { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", url: "https://www.google.com/about/careers/applications/jobs/results/" },
    { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg", url: "https://careers.microsoft.com" },
    { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg", url: "https://www.amazon.jobs" },
    { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", url: "https://jobs.netflix.com" },
    { name: "Meta", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png", url: "https://www.metacareers.com" },
    { name: "Adobe", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg", url: "https://careers.adobe.com" },
    { name: "Stripe", logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg", url: "https://stripe.com/jobs" },
    { name: "Airbnb", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg", url: "https://careers.airbnb.com" },
  ];

  const seekerFeatures = [
    {
    icon: <HiOutlineUserGroup />,
    text: "Connect directly with founders and hiring managers — no middlemen."
    },
    {
      icon: <HiOutlineCurrencyDollar />,
      text: "See salary and equity upfront before you apply."
    },
    {
      icon: <HiOutlineLightningBolt />,
      text: "One profile, one click to apply. No cover letters needed."
    },
    {
      icon: <HiOutlineSparkles />,
      text: "Exclusive roles at startups you can't find anywhere else."
    }
  ];

  const recruiterFeatures = [
    {
      icon: <HiUserGroup />,
      text: "Tap into a community of 10M+ startup-ready candidates."
    },
    {
      icon: <HiCog />,
      text: "Set up job posts and company branding in under 10 minutes."
    },
    {
      icon: <HiClipboardList />,
      text: "Free ATS built-in, or plug into the one you already use."
    },
    {
      icon: <HiChip />,
      text: "AI-powered sourcing scans 500M+ profiles and fills your calendar."
    }
  ];

  const testimonials = [
    { quote: "I got my tech job on SkillBridge and never looked back. Best decision of my career.", role: "Software Engineer at a Series B startup" },
    { quote: "The UI is clean, the jobs are real, and I found my current role entirely through the platform.", role: "Product Designer at a fintech startup" },
    { quote: "Half the offers I extend are sourced here. It's the best product for startup talent bar none.", role: "Head of Talent at a YC startup" },
    { quote: "I can't imagine recruiting without SkillBridge. It's that embedded in my workflow.", role: "Founder & CEO, 50-person startup" },
  ];

  return (
    <div className="home-page">

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-eyebrow">130,000+ open roles · Updated daily</p>
          <h1 className="home-hero-title">
            Where startups and<br />job seekers <span>connect</span>
          </h1>
          <p className="home-hero-subtitle">
            Apply privately to thousands of tech jobs with one profile. See salary and equity upfront.
          </p>

          <div className="home-cta-row">
            <div className="home-cta-card" onClick={() => navigate("/register")}>
              <span className="home-cta-label">For Job Seekers</span>
              <p className="home-cta-desc">Browse 130K+ jobs at startups you'll love</p>
              <button className="home-cta-btn home-seeker-btn">Find your next job →</button>
            </div>
            <div className="home-cta-divider">or</div>
            <div className="home-cta-card" onClick={() => navigate("/register")}>
              <span className="home-cta-label">For Companies</span>
              <p className="home-cta-desc">Reach 10M+ startup-ready candidates</p>
              <button className="home-cta-btn home-recruiter-btn">Find your next hire →</button>
            </div>
          </div>
        </div>
      </section>

      {/* SCROLLING MARQUEE */}
      <div className="home-marquee-wrapper">
        <div className="home-marquee-track">
          {[...tags, ...tags].map((tag, i) => (
            <span key={i} className="home-marquee-tag">{tag}</span>
          ))}
        </div>
      </div>

      {/* STATS + LOGOS */}
      <section className="home-stats-section">
        <div className="home-stats-row">
          <div className="home-stat-item">
            <h2>10M+</h2>
            <p>Startup-ready candidates</p>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item">
            <h2>130K+</h2>
            <p>Active tech jobs</p>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item">
            <h2>8M+</h2>
            <p>Matches made</p>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item">
            <h2>50K+</h2>
            <p>Companies hiring</p>
          </div>
        </div>

        <p className="home-logos-label">Candidates placed at companies like</p>
        <div className="home-logos-strip">
          {companies.map((c) => (
            <a 
              href={c.url} 
              key={c.name} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="home-logo-item"
            >
              <img src={c.logo} alt={c.name} />
            </a>
          ))}
        </div>
      </section>

      {/* DUAL FEATURE PANELS */}
      <section className="home-dual-section" id="why">
        <div className="home-dual-panel home-seeker-panel">
          <div className="home-panel-inner">
            <span className="home-panel-eyebrow">Got talent?</span>
            <h2 className="home-panel-title">Why job seekers love us</h2>
            <div className="home-feature-list">
              {seekerFeatures.map((f, i) => (
                <div className="home-feature-item" key={i}>
                  <span className="home-feature-icon">{f.icon}</span>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
            <div className="home-panel-actions">
              <button className="home-panel-primary-btn" onClick={() => navigate("/register")}>Sign up free</button>
              <button className="home-panel-ghost-btn" onClick={() => navigate("/login")}>Learn more →</button>
            </div>
          </div>
        </div>

        <div className="home-dual-panel home-recruiter-panel">
          <div className="home-panel-inner">
            <span className="home-panel-eyebrow">Need talent?</span>
            <h2 className="home-panel-title">Why recruiters love us</h2>
            <div className="home-feature-list">
              {recruiterFeatures.map((f, i) => (
                <div className="home-feature-item" key={i}>
                  <span className="home-feature-icon">{f.icon}</span>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
            <div className="home-panel-actions">
              <button className="home-panel-primary-btn home-dark-btn" onClick={() => navigate("/register")}>Post a job free</button>
              <button className="home-panel-ghost-btn home-dark-ghost" onClick={() => navigate("/login")}>See pricing →</button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="home-categories-section" id="categories">
        <div className="home-section-header">
          <span className="home-section-badge">Browse by category</span>
          <h2 className="home-section-title">Find work in your field</h2>
          <p className="home-section-subtitle">Thousands of open roles across every tech discipline.</p>
        </div>
        <div className="home-categories-grid">
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
            <div className="home-category-card" key={cat.title} onClick={() => navigate("/login")}>
              <span className="home-cat-icon">{cat.icon}</span>
              <h3>{cat.title}</h3>
              <p>{cat.desc}</p>
              <span className="home-cat-arrow">→</span>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="home-testimonials-section">
        <div className="home-section-header">
          <span className="home-section-badge">From our users</span>
          <h2 className="home-section-title">People find what they're looking for</h2>
        </div>
        <div className="home-testimonials-grid">
          {testimonials.map((t, i) => (
            <div className="home-testimonial-card" key={i}>
              <p className="home-testimonial-quote">"{t.quote}"</p>
              <span className="home-testimonial-role">{t.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta-section">
        <div className="home-final-cta">
          <p className="home-cta-eyebrow">Join 10M+ candidates and 50K+ companies</p>
          <h2>Ready to find what's next?</h2>
          <p>Your next opportunity is one profile away.</p>
          <div className="home-cta-actions">
            <button className="home-cta-primary-btn" onClick={() => navigate("/register")}>Get started — it's free</button>
            <button className="home-cta-ghost-btn" onClick={() => navigate("/login")}>Already have an account?</button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;