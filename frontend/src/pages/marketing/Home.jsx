import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../Services/authUtils";
import { getJobs } from "../../Services/jobService";
import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  GraduationCap,
  HeartPulse,
  Headset,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  Utensils,
  X,
} from "lucide-react";

const categories = [
  { name: "Healthcare", detail: "Care, clinical & wellness", icon: HeartPulse, category: "healthcare" },
  { name: "Customer service", detail: "Support & success", icon: Headset, category: "customer_service" },
  { name: "Retail & sales", detail: "Stores, sales & service", icon: ShoppingBag, category: "retail_sales" },
  { name: "Education", detail: "Teaching & learning", icon: GraduationCap, category: "education" },
  { name: "Hospitality", detail: "Food, hotels & events", icon: Utensils, category: "hospitality" },
  { name: "Transportation", detail: "Driving & logistics", icon: Truck, category: "transportation" },
  { name: "Technology", detail: "IT, product & engineering", icon: Sparkles, category: "technology" },
  { name: "All opportunities", detail: "Explore every possibility", icon: BriefcaseBusiness, category: "all" },
];

function Home() {
  const navigate = useNavigate();
  const [jobQuery, setJobQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [previewCategory, setPreviewCategory] = useState(null);
  const [previewJobs, setPreviewJobs] = useState([]);
  const [previewTotalJobs, setPreviewTotalJobs] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const closeButtonRef = useRef(null);
  const PreviewIcon = previewCategory?.icon;

  const searchJobs = (query = jobQuery, location = locationQuery, category = "") => {
    const params = new URLSearchParams({ tab: "jobs" });
    if (query.trim()) params.set("search", query.trim());
    if (location.trim()) params.set("location", location.trim());
    if (category) params.set("category", category);
    navigate(`/candidate-dashboard?${params.toString()}`);
  };

  useEffect(() => {
    if (!previewCategory) return undefined;
    let cancelled = false;
    setPreviewJobs([]);
    setPreviewTotalJobs(0);
    setPreviewLoading(true);
    getJobs({ category: previewCategory.category, page: 1, limit: 10 })
      .then((result) => {
        if (!cancelled) {
          setPreviewJobs(result?.jobs || []);
          setPreviewTotalJobs(result?.totalJobs || result?.jobs?.length || 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewJobs([]);
          setPreviewTotalJobs(0);
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPreviewCategory(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      cancelled = true;
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewCategory]);

  const openCategory = (category) => {
    if (getStoredUser()?.role === "candidate") {
      searchJobs("", "", category);
      return;
    }
    setPreviewCategory(categories.find((item) => item.category === category));
  };

  const openPreviewJob = (job) => {
    const params = new URLSearchParams({ tab: "jobs", category: previewCategory.category, jobId: job._id });
    const redirectAfterLogin = `/candidate-dashboard?${params.toString()}`;
    if (getStoredUser()?.role === "candidate") {
      navigate(redirectAfterLogin);
      return;
    }
    navigate(`/register?redirect=${encodeURIComponent(redirectAfterLogin)}`, {
      state: { role: "candidate", redirectAfterLogin },
    });
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
          {categories.map(({ name, detail, icon: Icon, category }) => (
            <button className="home-category-card" key={name} type="button" onClick={() => openCategory(category)}>
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

      {previewCategory && (
        <div className="home-job-preview-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setPreviewCategory(null); }}>
          <section
            className="home-job-preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-job-preview-title"
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const buttons = event.currentTarget.querySelectorAll("button:not([disabled])");
              const first = buttons[0];
              const last = buttons[buttons.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
              }
            }}
          >
            <div className="home-job-preview-header">
              <div className="home-job-preview-heading">
                <div className="home-job-preview-category-icon"><PreviewIcon size={22} strokeWidth={1.8} /></div>
                <span className="home-job-preview-eyebrow"><span /> A quick look at</span>
                <h2 id="home-job-preview-title">{previewCategory.name} jobs</h2>
                <p>Real openings picked from across SkillBridge.</p>
                <div className="home-job-preview-meta">
                  {!previewLoading && previewTotalJobs > 0 && <span className="home-job-preview-count"><i />{previewTotalJobs.toLocaleString()} open roles</span>}
                  <span>Sign in to view details and apply</span>
                </div>
              </div>
              <button ref={closeButtonRef} className="home-job-preview-close" type="button" aria-label="Close job preview" onClick={() => setPreviewCategory(null)}><X size={20} /></button>
            </div>

            {previewLoading ? (
              <div className="home-job-preview-window home-job-preview-loading" role="status" aria-label={`Loading ${previewCategory.name} jobs`}>
                {[0, 1, 2].map((index) => <div key={index} className="home-job-preview-skeleton" />)}
              </div>
            ) : previewJobs.length ? (
              <div className="home-job-preview-window">
                <div className="home-job-preview-track">
                  {previewJobs.map((job) => (
                    <button key={job._id} className="home-job-preview-card" type="button" onClick={() => openPreviewJob(job)}>
                      <span className="home-job-preview-card-icon"><BriefcaseBusiness size={18} /></span>
                      <span className="home-job-preview-card-details">
                        <strong title={job.title}>{job.title}</strong>
                        <span title={job.company}>{job.company || "Hiring company"}</span>
                        <small>{job.location || "Location flexible"}</small>
                      </span>
                      <span className="home-job-preview-card-arrow"><ArrowRight size={18} /></span>
                      <span className="home-job-preview-card-tags">
                        {job.employmentType && <span><Clock3 size={12} />{job.employmentType}</span>}
                        {job.isRemote && <span>Remote</span>}
                        <span className="home-job-preview-card-open">Explore <ArrowRight size={12} /></span>
                      </span>
                    </button>
                  ))}
                  {previewJobs.map((job) => (
                    <div key={`copy-${job._id}`} className="home-job-preview-card home-job-preview-card-copy" aria-hidden="true">
                      <span className="home-job-preview-card-icon"><BriefcaseBusiness size={18} /></span>
                      <span className="home-job-preview-card-details">
                        <strong title={job.title}>{job.title}</strong>
                        <span title={job.company}>{job.company || "Hiring company"}</span>
                        <small>{job.location || "Location flexible"}</small>
                      </span>
                      <span className="home-job-preview-card-arrow"><ArrowRight size={18} /></span>
                      <span className="home-job-preview-card-tags">
                        {job.employmentType && <span><Clock3 size={12} />{job.employmentType}</span>}
                        {job.isRemote && <span>Remote</span>}
                        <span className="home-job-preview-card-open">Explore <ArrowRight size={12} /></span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="home-job-preview-empty">
                <span className="home-job-preview-empty-icon"><PreviewIcon size={22} /></span>
                <strong>No open roles just yet</strong>
                <span>Try another field or check back soon for new {previewCategory.name.toLowerCase()} jobs.</span>
              </div>
            )}

            <div className="home-job-preview-footer">
              <span><strong>Your next move starts here.</strong><small>Get the full details and apply in a few clicks.</small></span>
              <button type="button" onClick={() => {
                const redirect = `/candidate-dashboard?${new URLSearchParams({ tab: "jobs", category: previewCategory.category })}`;
                setPreviewCategory(null);
                navigate(`/register?redirect=${encodeURIComponent(redirect)}`, { state: { role: "candidate", redirectAfterLogin: redirect } });
              }}>Create a free account <ArrowRight size={16} /></button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Home;
