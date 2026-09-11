import { Link } from "react-router-dom";
import {
  Sparkles,
  Globe,
  TrendingUp,
  HeartHandshake,
  BriefcaseX,
  ArrowRight,
  Mail,
  CheckCircle2,
} from "lucide-react";

function Careers() {
  // ZERO OPENINGS PRESENT AS REQUESTED
  const openings = [];

  const benefits = [
    {
      icon: <Globe className="w-6 h-6 text-indigo-600" />,
      title: "Remote & Hybrid Culture",
      desc: "Flexible work arrangements with hybrid and remote opportunities across timezones.",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
      title: "Rapid Career Growth",
      desc: "Learn, experiment, and scale along with high-impact, passionate product builders.",
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-600" />,
      title: "AI-First Innovation",
      desc: "Work on cutting-edge vector search, local NER pipelines, and automated ticket agents.",
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-blue-600" />,
      title: "Ownership & Collaboration",
      desc: "Be part of a transparent team where every voice is heard and ownership is celebrated.",
    },
  ];

  return (
    <div className="careers-page-container">
      {/* 1. HERO */}
      <section className="careers-hero-wrapper">
        <div className="careers-hero-badge">
          <Sparkles size={16} className="badge-sparkle" />
          <span>Join the SkillBridge Team</span>
        </div>

        <h1 className="careers-hero-title">
          Build The Future Of <br />
          <span className="careers-title-gradient">Modern Recruitment</span>
        </h1>

        <p className="careers-hero-subtitle">
          At SkillBridge, we’re building AI-powered tools that connect talented people with career-defining opportunities. Join us in shaping transparent, smart, and human hiring.
        </p>
      </section>

      {/* 2. WHY WORK WITH US */}
      <section className="careers-benefits-section">
        <div className="section-header">
          <span className="section-kicker">Life At SkillBridge</span>
          <h2>Why Work With Us?</h2>
          <p>We foster an environment of radical ownership, fast iteration, and continuous learning.</p>
        </div>

        <div className="benefits-grid">
          {benefits.map((b, idx) => (
            <div className="benefit-card" key={idx}>
              <div className="benefit-icon-wrapper">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. JOB OPENINGS (ZERO OPENINGS STATE) */}
      <section className="careers-openings-section">
        <div className="section-header">
          <span className="section-kicker">Current Opportunities</span>
          <h2>Open Positions (0)</h2>
          <p>Explore current role openings across our engineering, product, and operations teams.</p>
        </div>

        {openings.length === 0 ? (
          <div className="zero-openings-card">
            <div className="zero-openings-icon">
              <BriefcaseX size={36} className="text-indigo-600" />
            </div>
            <h3>No Active Positions Open Right Now</h3>
            <p>
              We currently do not have any active role openings available. However, we are continuously expanding and love connecting with talented engineers, designers, and growth leaders!
            </p>
            <div className="zero-openings-actions">
              <a href="mailto:careers@skillbridge.com" className="talent-pool-btn">
                <Mail size={18} /> Join Our Talent Network
              </a>
              <Link to="/about" className="learn-more-btn">
                Learn About Our Tech Stack <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="openings-grid">
            {openings.map((job, index) => (
              <div className="job-card" key={index}>
                <div className="job-top">
                  <h3>{job.role}</h3>
                  <span className="job-type">{job.type}</span>
                </div>
                <p className="job-location">📍 {job.location}</p>
                <p className="job-desc">{job.desc}</p>
                <button className="apply-btn">Apply Now</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. CULTURE & VALUES */}
      <section className="careers-culture-section">
        <div className="culture-card">
          <h2>Our Culture & Expectations</h2>
          <p>
            We believe in transparency, speed, curiosity, and deep craftsmanship. Whether you’re an engineer optimizing vector embeddings, a UI designer crafting candidate flows, or an operations manager tuning bot workflows — your ideas directly shape the platform.
          </p>
          <div className="culture-pills">
            <span className="culture-pill"><CheckCircle2 size={16} /> High Ownership</span>
            <span className="culture-pill"><CheckCircle2 size={16} /> Async-First Work</span>
            <span className="culture-pill"><CheckCircle2 size={16} /> Continuous Feedback</span>
            <span className="culture-pill"><CheckCircle2 size={16} /> Competitive Pay</span>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="careers-cta-wrapper">
        <div className="careers-cta-card">
          <h2>Don’t See Your Ideal Role?</h2>
          <p>We’re always eager to meet exceptional builders. Send us your portfolio, GitHub, or resume and let’s start a conversation.</p>
          <a href="mailto:careers@skillbridge.com" className="cta-mail-btn">
            <Mail size={18} /> Contact Talent Team
          </a>
        </div>
      </section>
    </div>
  );
}

export default Careers;