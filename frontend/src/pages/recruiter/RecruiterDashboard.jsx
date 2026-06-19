import { useState, useEffect } from "react";
import { createJob, getRecruiterJobs, deleteJob, updateJob, getRecruiterApplications, updateStatus } from "../../Services/jobService";
import toast from "react-hot-toast";
import "../../Styles/pages/RecruiterDashboard.css";

// Import premium icons from the react-icons/hi library
import {
  HiUserGroup,
  HiCog,
  HiClipboardList,
  HiChip,
  HiOutlineHome,
  HiOutlineMail,
  HiOutlineChartBar,
  HiOutlineOfficeBuilding,
  HiOutlineLogout,
  HiOutlineBell,
  HiOutlineChat,
  HiChevronDown,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineXCircle
} from "react-icons/hi";

const initialFormState = { title: "", role: "", company: "", location: "", salary: "", description: "" };

function RecruiterDashboard() {
  const [formData, setFormData] = useState(initialFormState);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, shortlisted: 0, rejected: 0 });
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchJobs(), fetchStats(), fetchApplications()]);
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
    if (formData.description.trim().length < 15) return toast.error("Description too short");

    try {
      setSubmitting(true);
      let response = editingJob ? await updateJob(editingJob._id, formData) : await createJob(formData);

      toast.success(response?.message || (editingJob ? "Job updated successfully" : "Job created successfully"));
      cancelEdit();
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

  const fetchApplications = async () => {
    try {
      const res = await getRecruiterApplications();
      setApplications(res?.applications || []);
    } catch (error) { console.error(error); }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await updateStatus(applicationId, status);
      toast.success(`Application state marked as ${status}`);
      await fetchDashboardData();
    } catch (error) { toast.error("Failed to update status"); }
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
      role: job.role || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      description: job.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingJob(null); setFormData(initialFormState); };

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [job.title, job.company, job.location, job.role]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(query));
  });

  const recentApplications = applications.slice(0, 4);

  const countsByJob = (jobId) => {
    const jobApps = applications.filter((app) => app.job?._id === jobId || app.job === jobId);
    return {
      total: jobApps.length,
      shortlisted: jobApps.filter((app) => app.status === "shortlisted").length,
    };
  };

  const skillCounts = jobs.reduce((acc, job) => {
    const rawSkills = Array.isArray(job.skillsRequired) ? job.skillsRequired : [];
    rawSkills.forEach((skill) => {
      const normalized = skill?.trim();
      if (normalized) acc[normalized] = (acc[normalized] || 0) + 1;
    });
    return acc;
  }, {});

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  const statusClass = (status) => {
    if (status === "rejected") return "status-badge rejected";
    if (status === "shortlisted") return "status-badge shortlisted";
    return "status-badge open";
  };

  return (
    <div className="recruiter-dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-brand">
            <div>
              <h1>SkillBridge</h1>
              <p>Recruiter Portal</p>
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Primary navigation">
            <button className="sidebar-item active"><span className="sidebar-icon"><HiOutlineHome /></span>Dashboard</button>
            <button className="sidebar-item"><span className="sidebar-icon"><HiClipboardList /></span>My Jobs</button>
            <button className="sidebar-item"><span className="sidebar-icon"><HiUserGroup /></span>Applicants</button>
            <button className="sidebar-item"><span className="sidebar-icon"><HiChip /></span>Shortlisted</button>
            <button className="sidebar-item"><span className="sidebar-icon"><HiOutlineMail /></span>Messages</button>
            <button className="sidebar-item"><span className="sidebar-icon"><HiOutlineChartBar /></span>Analytics</button>
            <button className="sidebar-item"><span className="sidebar-icon"><HiOutlineOfficeBuilding /></span>Company Profile</button>
          </nav>
        </div>
        <div className="sidebar-bottom-nav">
          <button className="sidebar-item"><span className="sidebar-icon"><HiCog /></span>Settings</button>
          <button type="button" className="sidebar-item sidebar-logout"><span className="sidebar-icon"><HiOutlineLogout /></span>Logout</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <section className="dashboard-topbar">
          <div className="topbar-copy">
            <p className="eyebrow">Good Morning, Recruiter 👋</p>
            <h2>Let's find the perfect talent today.</h2>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <span className="search-icon">🔍</span>
              <input type="search" placeholder="Search jobs, candidates, skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search jobs" />
            </label>
            <button type="button" className="icon-btn notification-btn" aria-label="Notifications">
              <span className="icon"><HiOutlineBell /></span><span className="badge">3</span>
            </button>
            <button type="button" className="icon-btn message-btn" aria-label="Messages"><span className="icon"><HiOutlineChat /></span></button>
            <button type="button" className="topbar-profile" aria-label="Recruiter profile">
              <div className="profile-avatar">RC</div>
              <div className="profile-details"><span className="profile-name">Recruiter Name</span><span className="profile-role">Talent Lead</span></div>
              <span className="profile-chevron"><HiChevronDown /></span>
            </button>
          </div>
        </section>

        {/* Analytics Scorecard Row using clear semantic vector icons */}
        <section className="dashboard-stats-row stats-grid">
          <div className="stat-box">
            <div className="stat-header"><div className="stat-icon stat-icon-purple"><HiClipboardList /></div></div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.totalJobs}</h3>
              <p className="stat-label">Total Jobs</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-header"><div className="stat-icon stat-icon-blue"><HiUserGroup /></div></div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.totalApplications}</h3>
              <p className="stat-label">Applications</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-header"><div className="stat-icon stat-icon-green"><HiOutlineCheckCircle /></div></div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.shortlisted}</h3>
              <p className="stat-label">Shortlisted</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-header"><div className="stat-icon stat-icon-red"><HiOutlineXCircle /></div></div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.rejected}</h3>
              <p className="stat-label">Rejected</p>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <aside className="dashboard-panel job-form-panel">
            <div className="panel-card sticky-card">
              <div className="panel-heading">
                <h3>{editingJob ? "Edit job listing" : "Create new job"} ✨</h3>
                <p className="form-subtitle">Fill in the details to post a new opportunity.</p>
              </div>
              <form onSubmit={handleSubmit} className="job-form" aria-label="Job form">
                <div className="form-section">
                  <label htmlFor="title" className="form-label">Job Title</label>
                  <input id="title" name="title" className="form-control" value={formData.title} onChange={handleChange} placeholder="e.g., Product Designer" required />
                  <label htmlFor="company" className="form-label">Company</label>
                  <input id="company" name="company" className="form-control" value={formData.company} onChange={handleChange} placeholder="e.g., Acme Inc" />
                  <label htmlFor="location" className="form-label">Location</label>
                  <input id="location" name="location" className="form-control" value={formData.location} onChange={handleChange} placeholder="e.g., Remote" />
                </div>
                <div className="form-section form-row">
                  <div className="form-field">
                    <label htmlFor="role" className="form-label">Job Type</label>
                    <select id="role" name="role" className="form-control" value={formData.role} onChange={handleChange}>
                      <option value="">Select a role</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="salary" className="form-label">Salary</label>
                    <input id="salary" name="salary" className="form-control" value={formData.salary} onChange={handleChange} placeholder="₹ 10,00,000" inputMode="numeric" />
                  </div>
                </div>
                <div className="form-section">
                  <label htmlFor="description" className="form-label">Job Description</label>
                  <textarea id="description" name="description" className="form-control form-textarea" value={formData.description} onChange={handleChange} rows={5} placeholder="Describe the role." />
                  <p className="char-counter">{formData.description.length} / 1000 characters</p>
                </div>
                <div className="form-actions">
                  <button type="submit" className="create-job-btn" disabled={submitting}>
                    {submitting ? "Saving..." : editingJob ? "Update job" : "🚀 Post job"}
                  </button>
                  {editingJob && <button type="button" className="clear-form-btn" onClick={cancelEdit}>Clear</button>}
                </div>
              </form>
            </div>
          </aside>

          <section className="dashboard-panel jobs-panel">
            <div className="panel-heading panel-heading-row">
              <div>
                <h3>My Posted Jobs</h3>
                <p className="form-subtitle">Manage and track all active opportunities.</p>
              </div>
              <button type="button" className="primary-btn-small" onClick={handleQuickCreate}><HiOutlinePlus style={{ marginRight: "4px", verticalAlign: "middle" }} /> Create Job</button>
            </div>
            <div className="jobs-header-actions">
              <div className="filter-tabs">
                <button className="filter-tab active">All</button>
                <button className="filter-tab">Active</button>
                <button className="filter-tab">Draft</button>
                <button className="filter-tab">Closed</button>
              </div>
            </div>
            <div className="jobs-grid">
              {loading ? (
                <div className="loading-state"><div className="skeleton-card"></div><div className="skeleton-card"></div></div>
              ) : filteredJobs.length === 0 ? (
                <div className="empty-state"><p className="empty-icon">📋</p><p className="empty-title">No jobs posted yet</p></div>
              ) : (
                filteredJobs.map((job) => {
                  const counts = countsByJob(job._id);
                  const statStatus = job.status ? job.status.toLowerCase() : "active";
                  return (
                    <article key={job._id} className="job-card">
                      <div className="job-card-header">
                        <div>
                          <h4>{job.title}</h4>
                          <p className="job-company-location">{job.company} • {job.location || "Remote"}</p>
                        </div>
                        <span className={`status-badge status-${statStatus}`}>{statStatus}</span>
                      </div>
                      <div className="job-card-details">
                        <span className="job-detail">₹{Number(job.salary || 0).toLocaleString("en-IN")}</span>
                        <span className="job-detail">{job.role || "Full-time"}</span>
                      </div>
                      <div className="job-card-metrics">
                        <div className="metric-pill"><span className="metric-number">{counts.total}</span><span className="metric-label">Applications</span></div>
                        <div className="metric-pill"><span className="metric-number">{counts.shortlisted}</span><span className="metric-label">Shortlisted</span></div>
                      </div>
                      <div className="card-actions">
                        <button type="button" className="edit-btn" onClick={() => handleEdit(job)}>✏️ Edit</button>
                        <button type="button" className="delete-btn" onClick={() => handleDelete(job._id)}>🗑️ Delete</button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </section>

        <section className="dashboard-bottom-grid">
          <section className="panel-card recent-applications-panel">
            <div className="panel-heading panel-heading-row">
              <div><p className="eyebrow">Candidate flow</p><h3>Recent applications</h3></div>
              <button type="button" className="view-all-btn">View all</button>
            </div>
            <div className="applications-list">
              {recentApplications.length === 0 ? (
                <div className="empty-state-card">No recent applications available.</div>
              ) : (
                recentApplications.map((app) => (
                  <div key={app._id} className={`application-card ${selectedApplication?._id === app._id ? "active" : ""}`} onClick={() => setSelectedApplication(app)}>
                    <div className="application-summary">
                      <div>
                        <h4>{app.candidate?.name || app.name || "Candidate"}</h4>
                        <p className="application-meta">Applied for <strong>{app.job?.title || "job"}</strong></p>
                      </div>
                      <span className={statusClass(app.status || "pending")}>{app.status || "Pending"}</span>
                    </div>
                    <div className="application-actions">
                      {app.resume ? <a className="resume-btn" href={app.resume} target="_blank" rel="noreferrer">Resume</a> : <span className="resume-btn disabled">No resume</span>}
                      <button type="button" className="shortlist-btn" onClick={() => handleUpdateStatus(app._id, "shortlisted")}>Shortlist</button>
                      <button type="button" className="reject-btn" onClick={() => handleUpdateStatus(app._id, "rejected")}>Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="dashboard-side-widgets">
            <section className="panel-card analytics-widget">
              <div className="panel-heading"><p className="eyebrow">Analytics</p><h3>Hiring funnel</h3></div>
              <div className="funnel-list">
                <div className="funnel-row"><span>Applications</span><strong>{stats.totalApplications}</strong></div>
                <div className="funnel-row"><span>Shortlisted</span><strong>{stats.shortlisted}</strong></div>
                <div className="funnel-row"><span>Rejected</span><strong>{stats.rejected}</strong></div>
              </div>
            </section>
            <section className="panel-card skills-widget">
              <div className="panel-heading"><p className="eyebrow">Skills insight</p><h3>Top requirements</h3></div>
              <div className="skills-list">
                {topSkills.length === 0 ? (
                  <div className="empty-state-card">Add skills to jobs to see insights.</div>
                ) : (
                  topSkills.map((item) => {
                    const percent = Math.min(100, Math.round((item.count / Math.max(1, jobs.length)) * 100));
                    return (
                      <div key={item.skill} className="skill-row">
                        <div className="skill-label"><span>{item.skill}</span><strong>{item.count}</strong></div>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default RecruiterDashboard;