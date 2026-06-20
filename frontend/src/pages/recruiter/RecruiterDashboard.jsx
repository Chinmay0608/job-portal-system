import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createJob, getRecruiterJobs, deleteJob, updateJob, getRecruiterApplications } from "../../Services/jobService";
import toast from "react-hot-toast";
import "../../Styles/pages/RecruiterDashboard.css";

// Import exact matching React Icons from Heroicons v2 (hi2)
import {
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineUsers,
  HiOutlineCheckBadge,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChartBar,
  HiOutlineBuildingOffice,
  HiOutlineCog,
  HiOutlineBell,
  HiChevronDown,
  HiOutlinePlus,
  HiEllipsisVertical,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlineSquares2X2,
  HiOutlineListBullet,
  HiMiniBriefcase,
  HiMiniUsers,
  HiMiniCheckCircle,
  HiMiniXCircle
} from "react-icons/hi2";

const initialFormState = { title: "", role: "Full-time", company: "", location: "", salary: "", description: "" };

function RecruiterDashboard() {
  const [formData, setFormData] = useState(initialFormState);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, shortlisted: 0, rejected: 0 });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchJobs(), fetchStats()]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickCreate = () => {
    setEditingJob(null);
    setFormData(initialFormState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.trim().length < 3) return toast.error("Job title must be at least 3 characters");
    if (Number(formData.salary) <= 0) return toast.error("Salary must be greater than 0");
    
    try {
      setSubmitting(true);
      let response = editingJob ? await updateJob(editingJob._id, formData) : await createJob(formData);
      toast.success(response?.message || (editingJob ? "Job updated successfully" : "Job created successfully"));
      setFormData(initialFormState);
      setEditingJob(null);
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally { setSubmitting(false); }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getRecruiterJobs();
      setJobs(response?.jobs || []);
    } catch (error) { toast.error("Failed to load jobs"); } 
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([getRecruiterApplications(), getRecruiterJobs()]);
      const apps = appRes?.applications || [];
      setStats({
        totalJobs: (jobRes?.jobs || []).length,
        totalApplications: apps.length,
        shortlisted: apps.filter((a) => a.status === "shortlisted").length,
        rejected: apps.filter((a) => a.status === "rejected").length,
      });
    } catch (error) { console.error("Stats Error:", error); }
  };

  const handleDelete = async (jobId) => {
    try {
      const response = await deleteJob(jobId);
      toast.success(response?.message || "Job deleted");
      await fetchDashboardData();
    } catch (error) { toast.error(error?.response?.data?.message || "Delete failed"); }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || "",
      role: job.role || "Full-time",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      description: job.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getJobIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes("react") || t.includes("frontend") || t.includes("ui")) return "⚛️";
    if (t.includes("java") || t.includes("backend")) return "☕";
    if (t.includes("devops") || t.includes("cloud")) return "☁️";
    if (t.includes("full stack") || t.includes("stack")) return "🥞";
    return "💻";
  };

  return (
    <div className="recruiter-dashboard-shell">
      {/* 1. LEFT SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-brand">
            <Link to="/" className="brand-logo-link">
              <span className="brand-text-span brand-mix">
                <span className="part-red">Skill</span>
                <span className="part-black">bridge</span>
              </span>
            </Link>
          </div>
          <nav className="sidebar-nav">
            <button className="sidebar-item active"><HiOutlineHome className="sidebar-icon" />Dashboard</button>
            <button className="sidebar-item"><HiOutlineBriefcase className="sidebar-icon" />My Jobs</button>
            <button className="sidebar-item"><HiOutlineUsers className="sidebar-icon" />Applicants</button>
            <button className="sidebar-item"><HiOutlineCheckBadge className="sidebar-icon" />Shortlisted</button>
            <button className="sidebar-item"><HiOutlineChatBubbleLeftRight className="sidebar-icon" />Messages</button>
            <button className="sidebar-item"><HiOutlineChartBar className="sidebar-icon" />Analytics</button>
            <button className="sidebar-item"><HiOutlineBuildingOffice className="sidebar-icon" />Company Profile</button>
            <button className="sidebar-item"><HiOutlineCog className="sidebar-icon" />Settings</button>
          </nav>
        </div>
      </aside>

      {/* 2. MAIN HUB VISUAL AREA */}
      <main className="dashboard-main">
        {/* TOP UTILITY HEADER PANEL */}
        <section className="dashboard-topbar">
          <div className="topbar-copy">
            <h2>Welcome back, Recruiter! 👋</h2>
            <p className="eyebrow">Manage your jobs and find the best talent</p>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-btn notification-btn">
              <HiOutlineBell />
              <span className="badge">3</span>
            </button>
            <button type="button" className="text-action-btn">View Applicants</button>
            <button type="button" className="primary-accent-btn" onClick={handleQuickCreate}>
              <HiOutlinePlus /> Create Job
            </button>
            <div className="topbar-profile">
              <div className="profile-avatar-circle">R</div>
            </div>
          </div>
        </section>

        {/* METRICS ROW SCORECARDS */}
        <section className="stats-grid">
          <div className="stat-box">
            <div className="stat-row-top">
              <div className="stat-icon stat-icon-purple"><HiMiniBriefcase /></div>
            </div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.totalJobs}</h3>
              <p className="stat-label">Total Jobs</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-row-top">
              <div className="stat-icon stat-icon-blue"><HiMiniUsers /></div>
            </div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.totalApplications}</h3>
              <p className="stat-label">Applications</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-row-top">
              <div className="stat-icon stat-icon-green"><HiMiniCheckCircle /></div>
            </div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.shortlisted}</h3>
              <p className="stat-label">Shortlisted</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-row-top">
              <div className="stat-icon stat-icon-red"><HiMiniXCircle /></div>
            </div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.rejected}</h3>
              <p className="stat-label">Rejected</p>
            </div>
          </div>
        </section>

        {/* DESKTOP SPLIT LAYER ARCHITECTURE */}
        <section className="dashboard-grid">
          {/* LEFT COLUMN PANEL — POLYMORPHIC INTERACTION WRAPPER */}
          <aside className="dashboard-panel job-form-panel">
            <div className="panel-card sticky-card">
              <div className="panel-heading">
                <h3>Create <span className="highlight-purple">New Job</span></h3>
                <p className="form-subtitle">Fill in the details to post a new job</p>
              </div>
              <form onSubmit={handleSubmit} className="job-form">
                <div className="input-field-box">
                  <span className="field-prefix-icon"><HiOutlineBriefcase /></span>
                  <div className="input-stack">
                    <label>Job Title</label>
                    <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Frontend Developer" required />
                  </div>
                </div>

                <div className="input-field-box">
                  <span className="field-prefix-icon"><HiOutlineBuildingOffice /></span>
                  <div className="input-stack">
                    <label>Company</label>
                    <input name="company" value={formData.company} onChange={handleChange} placeholder="e.g. Google" required />
                  </div>
                </div>

                <div className="input-field-box">
                  <span className="field-prefix-icon"><HiOutlineMapPin /></span>
                  <div className="input-stack">
                    <label>Location</label>
                    <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Bangalore" required />
                  </div>
                </div>

                <div className="form-row-split">
                  <div className="input-field-box split-box">
                    <span className="field-prefix-icon"><HiOutlineCurrencyRupee /></span>
                    <div className="input-stack">
                      <label>Salary</label>
                      <input name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. 1800000" inputMode="numeric" required />
                    </div>
                  </div>
                  <div className="custom-dropdown-container">
                    <select name="role" value={formData.role} onChange={handleChange} className="form-select-native">
                      <option value="Full-time">INR</option>
                      <option value="Part-time">USD</option>
                      <option value="Contract">EUR</option>
                    </select>
                    <HiChevronDown className="select-dropdown-arrow" />
                  </div>
                </div>

                <div className="input-field-box textarea-field-box">
                  <span className="field-prefix-icon prefix-textarea-icon"><HiOutlineDocumentText /></span>
                  <div className="input-stack">
                    <label>Job Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Write job description..." required />
                  </div>
                </div>

                <button type="submit" className="post-job-submit-btn" disabled={submitting}>
                  🚀 {editingJob ? "Update Job" : "Post Job"}
                </button>
              </form>
            </div>
          </aside>

          {/* RIGHT COLUMN PANEL — GRID VACANCY CONTAINER CARDS */}
          <section className="dashboard-panel jobs-panel">
            <div className="panel-heading-row-top">
              <h3>My Posted Jobs</h3>
              <div className="filter-controls-cluster">
                <div className="dropdown-filter-pill">
                  <HiOutlineBriefcase className="filter-pill-icon" />
                  <select className="pill-native-select">
                    <option>All Jobs</option>
                    <option>Active</option>
                    <option>Draft</option>
                  </select>
                  <HiChevronDown className="pill-dropdown-arrow" />
                </div>
                <div className="view-toggle-buttons">
                  <button type="button" className="view-toggle-btn active"><HiOutlineSquares2X2 /></button>
                  <button type="button" className="view-toggle-btn"><HiOutlineListBullet /></button>
                </div>
              </div>
            </div>

            <div className="jobs-grid-cards">
              {loading ? (
                <div className="loader-mesh-placeholder">Loading job opportunities...</div>
              ) : jobs.length === 0 ? (
                <div className="empty-state-mesh">No job cards active. Create your first post using the left panel.</div>
              ) : (
                jobs.map((job) => (
                  <article key={job._id} className="job-item-card">
                    <div className="card-core-identity">
                      <h4>{job.title}</h4>
                      <p className="card-company-subtext">{job.company}</p>
                    </div>

                    <div className="card-location-row-meta">
                      <HiOutlineMapPin className="meta-pin-icon" />
                      <span>{job.location || "Remote, India"}</span>
                    </div>

                    <div className="card-compensation-salary">
                      ₹{Number(job.salary || 0).toLocaleString("en-IN")}
                    </div>

                    <div className="card-operational-ctas">
                      <button type="button" className="cta-edit-outline" onClick={() => handleEdit(job)}>Edit</button>
                      <button type="button" className="cta-delete-solid" onClick={() => handleDelete(job._id)}>Delete</button>
                    </div>
                  </article>
                ))
              )}
            </div>
            
            {jobs.length > 0 && (
              <button type="button" className="load-more-foot-link">
                Load more jobs <HiChevronDown />
              </button>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default RecruiterDashboard;