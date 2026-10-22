import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  HeartPulse,
  Headset,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  Utensils,
} from "lucide-react";

const categories = [
  { name: "Healthcare", detail: "Care, clinical & wellness", icon: HeartPulse },
  { name: "Customer service", detail: "Support & success", icon: Headset },
  { name: "Retail & sales", detail: "Stores, sales & service", icon: ShoppingBag },
  { name: "Education", detail: "Teaching & learning", icon: GraduationCap },
  { name: "Hospitality", detail: "Food, hotels & events", icon: Utensils },
  { name: "Transportation", detail: "Driving & logistics", icon: Truck },
  { name: "Technology", detail: "IT, product & engineering", icon: Sparkles },
  { name: "All opportunities", detail: "Explore every possibility", icon: BriefcaseBusiness, query: "" },
];

function Home() {
  const navigate = useNavigate();
  const [jobQuery, setJobQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  const searchJobs = (query = jobQuery, location = locationQuery) => {
    const params = new URLSearchParams({ tab: "jobs" });
    if (query.trim()) params.set("search", query.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/candidate-dashboard?${params.toString()}`);
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-copy">
            <p className="home-eyebrow"><span /> A place for every kind of work</p>
            <h1 className="home-hero-title">Find work that <span>works for you.</span></h1>
            <p className="home-hero-subtitle">
              Search opportunities across industries, experience levels, and ways of working. Your next step can start here.
            </p>

            <form className="home-search-form" onSubmit={(event) => { event.preventDefault(); searchJobs(); }}>
              <label className="home-search-field">
                <Search size={19} aria-hidden="true" />
                <span className="home-search-input-wrap">
                  <span>What kind of work?</span>
                  <input value={jobQuery} onChange={(event) => setJobQuery(event.target.value)} placeholder="Job title, skill, or company" />
                </span>
              </label>
              <span className="home-search-divider" aria-hidden="true" />
              <label className="home-search-field home-location-field">
                <MapPin size={19} aria-hidden="true" />
                <span className="home-search-input-wrap">
                  <span>Where?</span>
                  <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="City, state, or remote" />
                </span>
              </label>
              <button className="home-search-submit-btn" type="submit"><Search size={17} aria-hidden="true" /> Find jobs</button>
            </form>

            <div className="home-popular-searches">
              <span>Popular:</span>
              {["Remote", "Part-time", "Full time"].map((term) => (
                <button key={term} type="button" onClick={() => searchJobs(term, "")}>{term}</button>
              ))}
            </div>
          </div>

          <div className="home-hero-visual" aria-label="Explore career opportunities across different fields">
            <div className="home-visual-orbit home-visual-orbit-one" />
            <div className="home-visual-orbit home-visual-orbit-two" />
            <div className="home-visual-orbiting home-visual-orbiting-note"><div className="home-visual-orbit-counter"><div className="home-visual-note"><span className="home-visual-note-icon"><BriefcaseBusiness size={18} /></span><span><strong>Every path is different.</strong><small>Find yours.</small></span><ArrowRight size={18} /></div></div></div>
            <div className="home-visual-card home-visual-card-main">
              <span className="home-visual-kicker">A world of possibilities</span>
              <strong>Good work comes in many forms.</strong>
              <div className="home-visual-tags"><span>Full-time</span><span>Flexible</span><span>On-site</span></div>
            </div>
            <div className="home-visual-orbiting home-visual-orbiting-small"><div className="home-visual-orbit-counter"><div className="home-visual-card home-visual-card-small"><HeartPulse size={20} /><span>Care &amp; community</span></div></div></div>
            <div className="home-visual-orbiting home-visual-orbiting-bottom"><div className="home-visual-orbit-counter"><div className="home-visual-card home-visual-card-bottom"><GraduationCap size={20} /><span>Grow your skills</span></div></div></div>
          </div>
        </div>
      </section>

      <section className="home-categories-section" id="categories">
        <div className="home-section-header">
          <span className="home-section-badge">Explore opportunities</span>
          <h2 className="home-section-title">A job search as broad as your ambition.</h2>
          <p className="home-section-subtitle">Explore different fields, discover new possibilities, and find work that fits the life you want.</p>
        </div>
        <div className="home-categories-grid">
          {categories.map(({ name, detail, icon: Icon, query = name }) => (
            <button className="home-category-card" key={name} type="button" onClick={() => searchJobs(query, "")}>
              <span className="home-cat-icon"><Icon size={21} strokeWidth={1.8} /></span>
              <span className="home-cat-copy"><strong>{name}</strong><small>{detail}</small></span>
              <ArrowRight className="home-cat-arrow" size={18} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="home-how-section">
        <div className="home-section-header">
          <span className="home-section-badge">A simpler way forward</span>
          <h2 className="home-section-title">Your next opportunity starts with one search.</h2>
        </div>
        <div className="home-steps-grid">
          <article className="home-step-card"><span>01</span><h3>Explore what’s out there</h3><p>Search by role, skill, company, or location to find opportunities across fields.</p></article>
          <article className="home-step-card"><span>02</span><h3>Find the right fit</h3><p>Compare the details that matter to you, from work type to location and schedule.</p></article>
          <article className="home-step-card"><span>03</span><h3>Take your next step</h3><p>Create your profile and keep your search and applications moving in one place.</p></article>
        </div>
      </section>

      <section className="home-employer-section">
        <div className="home-employer-copy">
          <span className="home-employer-label">For employers</span>
          <h2>Good people can move your business forward.</h2>
          <p>Share your opening and connect with people ready to bring their experience, skills, and perspective to your team.</p>
        </div>
        <button className="home-employer-btn" type="button" onClick={() => navigate("/register", { state: { role: "recruiter" } })}>Find your next hire <ArrowRight size={18} /></button>
      </section>

      <section className="home-final-section">
        <span>Wherever you’re starting from</span>
        <h2>There’s a next step for you.</h2>
        <button type="button" onClick={() => searchJobs("", "")}>Start your job search <ArrowRight size={18} /></button>
      </section>
    </div>
  );
}

export default Home;
