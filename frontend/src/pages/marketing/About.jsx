import { Link } from "react-router-dom";
import {
  Sparkles,
  Target,
  ShieldCheck,
  Zap,
  Users,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Globe,
  HeartHandshake,
  TrendingUp,
  Building2,
  BrainCircuit,
} from "lucide-react";

function About() {
  const pillars = [
    {
      icon: <BrainCircuit className="about-pillar-icon text-indigo-600" />,
      title: "AI-Powered Precision",
      description:
        "Our in-house vector embedding pipeline matches candidates with roles based on deep skill alignment, experience tier, and context — moving far beyond simple keyword matching.",
    },
    {
      icon: <CheckCircle2 className="about-pillar-icon text-emerald-600" />,
      title: "Zero-Ghosting Transparency",
      description:
        "Every application lifecycle step is clear and tracked. Candidates receive real-time status updates, while recruiters benefit from structured applicant pipelines.",
    },
    {
      icon: <ShieldCheck className="about-pillar-icon text-blue-600" />,
      title: "Verified Roles & PII Security",
      description:
        "We enforce automated PII masking, token sanitization, and recruiter verification to ensure every job listing is legitimate and candidate data stays private.",
    },
    {
      icon: <Zap className="about-pillar-icon text-amber-600" />,
      title: "Streamlined Hiring Speed",
      description:
        "From AI resume parsing to automated ticket resolution, SkillBridge cuts hiring turnaround times by up to 60%, allowing teams to secure top talent faster.",
    },
  ];

  const stats = [
    { number: "50K+", label: "Verified Jobs Posted", icon: <Briefcase /> },
    { number: "20K+", label: "Active Candidates", icon: <Users /> },
    { number: "1.5K+", label: "Hiring Enterprises", icon: <Building2 /> },
    { number: "98%", label: "Match Precision Score", icon: <TrendingUp /> },
  ];

  const valueProps = {
    candidates: [
      "AI-driven resume parsing & instant profile generation",
      "Semantic job matching matching your exact tech stack",
      "Direct recruiter communication & ticket support",
      "Transparent application status tracking",
    ],
    recruiters: [
      "Smart candidate triage with NLP sentiment & spam filters",
      "High-intent applicant recommendations with vector scoring",
      "Multi-channel job distribution & candidate management",
      "Automated Telegram alerts & operational desk tools",
    ],
  };

  return (
    <div className="about-page-container">
      {/* 1. HERO SECTION */}
      <section className="about-hero-wrapper">
        <div className="about-hero-badge">
          <Sparkles size={16} className="badge-sparkle" />
          <span>Redefining Job Discovery & Hiring</span>
        </div>

        <h1 className="about-hero-title">
          Bridging the Gap Between <br />
          <span className="about-title-gradient">Talent & Opportunity</span>
        </h1>

        <p className="about-hero-subtitle">
          SkillBridge was built on a simple conviction: finding a job or hiring exceptional people shouldn’t feel like sending applications into a void. We bring transparency, intelligence, and speed back to modern recruitment.
        </p>

        <div className="about-hero-actions">
          <Link to="/jobs" className="about-btn-primary">
            Explore Open Roles <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="about-btn-secondary">
            For Employers & Recruiters
          </Link>
        </div>
      </section>

      {/* 2. MISSION & VISION DUAL CARDS */}
      <section className="about-narrative-section">
        <div className="narrative-grid">
          <div className="narrative-card story-card">
            <div className="narrative-icon-wrapper bg-indigo-50 text-indigo-600">
              <HeartHandshake size={28} />
            </div>
            <h2>Why We Exist</h2>
            <p>
              Traditional job boards are noisy, flooded with spam, and lack genuine context. Job seekers spend hours customizing resumes only to receive automated rejection emails, while hiring managers drown in unqualified applicants.
            </p>
            <p className="mt-3">
              SkillBridge was engineered from the ground up to solve both sides of the equation — using local AI embeddings, NLP PII protection, and real-time operational workflows to make recruitment human, fast, and reliable.
            </p>
          </div>

          <div className="narrative-card mission-card">
            <div className="narrative-icon-wrapper bg-emerald-50 text-emerald-600">
              <Target size={28} />
            </div>
            <h2>Our Core Mission</h2>
            <p>
              Our mission is to create a trusted global talent marketplace where skills speak louder than keywords. We empower candidates to showcase their true potential while giving organizations the tools to hire smarter, faster, and fairer.
            </p>
            <div className="narrative-highlight-box">
              <Globe size={20} className="text-emerald-600" />
              <span>Connecting candidates & recruiters across 30+ tech domains worldwide.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE PILLARS / WHY SKILLBRIDGE */}
      <section className="about-pillars-section">
        <div className="section-header">
          <span className="section-kicker">Built For Performance</span>
          <h2>The SkillBridge Advantage</h2>
          <p>Four foundational pillars driving transparent matching and enterprise recruitment.</p>
        </div>

        <div className="pillars-grid">
          {pillars.map((pillar, idx) => (
            <div className="pillar-card" key={idx}>
              <div className="pillar-icon-container">{pillar.icon}</div>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DUAL PERSPECTIVES: CANDIDATES vs RECRUITERS */}
      <section className="about-audiences-section">
        <div className="section-header">
          <span className="section-kicker">Unified Ecosystem</span>
          <h2>Built for Both Sides of the Hiring Table</h2>
          <p>Whether you are pursuing your next career milestone or scaling a world-class team.</p>
        </div>

        <div className="audiences-grid">
          {/* Candidates Column */}
          <div className="audience-card candidate-audience">
            <div className="audience-badge candidate-badge">
              <Users size={16} /> Job Seekers & Professionals
            </div>
            <h3>Accelerate Your Career Journey</h3>
            <p>Discover roles tailored precisely to your skillset with complete visibility into every application.</p>
            <ul className="audience-list">
              {valueProps.candidates.map((item, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={18} className="text-indigo-600 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/jobs" className="audience-link text-indigo-600">
              Browse All Jobs <ArrowRight size={16} />
            </Link>
          </div>

          {/* Recruiters Column */}
          <div className="audience-card recruiter-audience">
            <div className="audience-badge recruiter-badge">
              <Building2 size={16} /> Employers & Hiring Managers
            </div>
            <h3>Hire Exceptional Talent Faster</h3>
            <p>Streamline candidate discovery, evaluate candidates with AI precision, and manage hiring workflows effortlessly.</p>
            <ul className="audience-list">
              {valueProps.recruiters.map((item, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/login" className="audience-link text-emerald-600">
              Start Hiring Today <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. IMPACT STATS BANNER */}
      <section className="about-stats-banner">
        <div className="stats-container">
          {stats.map((st, idx) => (
            <div className="stat-card" key={idx}>
              <div className="stat-icon">{st.icon}</div>
              <div className="stat-number">{st.number}</div>
              <div className="stat-label">{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION (CTA) */}
      <section className="about-cta-wrapper">
        <div className="about-cta-card">
          <div className="cta-sparkle-bg"></div>
          <h2>Ready to Experience Modern Hiring?</h2>
          <p>Join thousands of candidates finding meaningful work and recruiters building high-impact teams on SkillBridge.</p>
          <div className="cta-button-group">
            <Link to="/jobs" className="cta-primary-btn">
              Explore Jobs Now
            </Link>
            <Link to="/success-stories" className="cta-secondary-btn">
              Read Success Stories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;