import { useState, useEffect, useMemo, useRef } from "react";
import { createJob, getRecruiterJobs, deleteJob, updateJob, getRecruiterApplications } from "../../Services/jobService";
import toast from "react-hot-toast";
import "../../Styles/pages/recruiter/RecruiterDashboard.css";

import {
  HiOutlineBriefcase,
  HiChevronDown,
  HiOutlinePlus,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlineSquares2X2,
  HiOutlineListBullet,
  HiXMark,
  HiOutlineUserGroup
} from "react-icons/hi2";
const initialFormState = { title: "", role: "Full-time", company: "", location: "", salary: "", description: "" };
const JOBS_PER_PAGE = 6;

function RecruiterDashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      return null;
    }
  });

  const [formData, setFormData] = useState(initialFormState);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, shortlisted: 0, rejected: 0 });

  // Modal visibility for Create/Edit Job card
  const [showJobModal, setShowJobModal] = useState(false);

  // Filter: derived dynamically from real job data (no static dropdown options)
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // View mode: grid or list — both render the same real job data
  const [viewMode, setViewMode] = useState("grid");

  // Pagination
  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    await Promise.all([fetchJobs(), fetchStats()]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Opens the Create Job card as a modal overlay
  const handleQuickCreate = () => {
    setEditingJob(null);
    setFormData(initialFormState);
    setShowJobModal(true);
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setEditingJob(null);
    setFormData(initialFormState);
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
      setShowJobModal(false);
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getRecruiterJobs();
      setJobs(response?.jobs || []);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error("Stats Error:", error);
    }
  };

  const handleDelete = async (jobId) => {
    try {
      const response = await deleteJob(jobId);
      toast.success(response?.message || "Job deleted");
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
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
    setShowJobModal(true);
  };

  // Build the status filter's option list dynamically from the actual jobs returned —
  // no hardcoded "Active / Draft" options that don't map to real data.
  const availableRoleTypes = useMemo(() => {
    const types = new Set(jobs.map((job) => job.role).filter(Boolean));
    return ["All", ...Array.from(types)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "All") return jobs;
    return jobs.filter((job) => job.role === statusFilter);
  }, [jobs, statusFilter]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMoreJobs = visibleCount < filteredJobs.length;

  // Reset pagination whenever the filter changes so results start from the top
  useEffect(() => {
    setVisibleCount(JOBS_PER_PAGE);
  }, [statusFilter]);

  // Close the custom filter dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFilter = (type) => {
    setStatusFilter(type);
    setIsFilterOpen(false);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + JOBS_PER_PAGE);
  };

  return (
    <div className="recruiter-dashboard-shell seamless-page-canvas">
      <main className="dashboard-main full-width-layout">

        {/* SUB-HEADER CONTEXT ROW */}
        <div className="mobile-header-block-recruiter">
          <p className="eyebrow-deck">RECRUITER DECK</p>
          <h2 className="topbar-mobile-title">{user?.company || "Your Company"}</h2>
          <hr className="dashed-cable-divider" />
        </div>

        <section className="dashboard-topbar inline-subheading desktop-only-topbar">
          <div className="topbar-copy">
            <h2>Welcome back, Recruiter! 👋</h2>
            <p className="eyebrow">Manage your jobs and find the best talent</p>
          </div>
          <div className="topbar-actions">
            <button type="button" className="primary-accent-btn" onClick={handleQuickCreate}>
              <HiOutlinePlus /> Create Job
            </button>
          </div>
        </section>

        {/* SCORECARDS — all values are live from fetchStats(), no placeholders */}
        <section className="stats-grid">
          <div className="stat-box">
            <div className="stat-icon stat-icon-purple">💼</div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.totalJobs}</h3>
              <p className="stat-label">Total Jobs</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon stat-icon-blue">👥</div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.totalApplications}</h3>
              <p className="stat-label">Applications</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon stat-icon-green">✓</div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.shortlisted}</h3>
              <p className="stat-label">Shortlisted</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon stat-icon-red">✕</div>
            <div className="stat-info-block">
              <h3 className="stat-number">{stats.rejected}</h3>
              <p className="stat-label">Rejected</p>
            </div>
          </div>
        </section>

        {/* JOBS LISTING — now full width since the sidebar form is gone */}
        <section className="dashboard-grid single-column">
          <section className="dashboard-panel jobs-panel">
            <div className="panel-heading-row-top">
              <h3>My Posted Jobs</h3>
              <div className="filter-controls-cluster">
                {/* Desktop Dropdown */}
                <div className="dropdown-filter-pill desktop-only-filter" ref={filterRef}>
                  <button
                    type="button"
                    className="filter-pill-trigger"
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                  >
                    <HiOutlineBriefcase className="filter-pill-icon" />
                    <span>{statusFilter}</span>
                    <HiChevronDown className={`pill-dropdown-arrow ${isFilterOpen ? "open" : ""}`} />
                  </button>

                  {isFilterOpen && (
                    <div className="filter-dropdown-menu">
                      {availableRoleTypes.map((type) => (
                        <button
                          type="button"
                          key={type}
                          className={`filter-dropdown-item ${statusFilter === type ? "selected" : ""}`}
                          onClick={() => handleSelectFilter(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Scrollable Chips */}
                <div className="mobile-chip-scroller mobile-only-filter">
                  {availableRoleTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`scroll-chip ${statusFilter === type ? "active" : ""}`}
                      onClick={() => handleSelectFilter(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="view-toggle-buttons desktop-only-filter">
                  <button
                    type="button"
                    className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                  >
                    <HiOutlineSquares2X2 />
                  </button>
                  <button
                    type="button"
                    className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                  >
                    <HiOutlineListBullet />
                  </button>
                </div>
              </div>
            </div>

            <div className={viewMode === "grid" ? "jobs-grid-cards" : "jobs-list-cards"}>
              {loading ? (
                <div className="loader-mesh-placeholder">Loading job opportunities...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="empty-state-mesh">
                  {jobs.length === 0
                    ? "No job cards active. Create your first post using the button above."
                    : "No jobs match this filter."}
                </div>
              ) : (
                visibleJobs.map((job) => (
                  <article key={job._id} className="job-item-card">
                    <div className="card-status-badge">
                      <span className={job.isActive !== false ? "status-active" : "status-closed"}>
                        {job.isActive !== false ? "Active" : "Closed"}
                      </span>
                      <span className="time-posted">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="card-core-identity">
                      <h4>{job.title}</h4>
                      <p className="card-company-subtext">{job.company}</p>
                    </div>

                    <div className="card-meta-metrics">
                      <div className="card-location-row-meta">
                        <HiOutlineMapPin className="meta-pin-icon" />
                        <span>{job.location || "Remote, India"}</span>
                      </div>
                      
                      <div className="card-applicant-count">
                        <HiOutlineUserGroup className="meta-pin-icon" />
                        {/* Static approximation since applicant count isn't in job schema directly */}
                        <span>Applicants</span>
                      </div>
                    </div>

                    <div className="card-compensation-salary">
                      {typeof job.salary === 'string' && isNaN(Number(job.salary)) ? job.salary : `₹${Number(job.salary).toLocaleString("en-IN")}`}
                    </div>

                    <div className="card-operational-ctas">
                      <button type="button" className="cta-edit-outline" onClick={() => handleEdit(job)}>Edit</button>
                      <button type="button" className="cta-delete-solid" onClick={() => handleDelete(job._id)}>Delete</button>
                    </div>
                  </article>
                ))
              )}
            </div>

            {!loading && hasMoreJobs && (
              <button type="button" className="load-more-foot-link" onClick={handleLoadMore}>
                Load more jobs <HiChevronDown />
              </button>
            )}
          </section>
        </section>
      </main>

      {/* MOBILE FLOATING ACTION BUTTON */}
      <button className="mobile-fab-create-job" onClick={handleQuickCreate}>
        <HiOutlinePlus size={20} /> Post a new job
      </button>

      {/* CREATE / EDIT JOB MODAL — opens only when Create Job (or Edit) is clicked */}
      {showJobModal && (
        <div className="job-modal-overlay" onClick={closeJobModal}>
          <div className="job-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="panel-heading">
              <h3>{editingJob ? "Edit " : "Create "}<span className="highlight-purple">{editingJob ? "Job" : "New Job"}</span></h3>
              <button type="button" className="job-modal-close-btn" onClick={closeJobModal} aria-label="Close">
                <HiXMark />
              </button>
            </div>
            <p className="form-subtitle">
              {editingJob ? "Update the details for this job listing" : "Fill in the details to post a new job"}
            </p>

            <form onSubmit={handleSubmit} className="job-form">
              <div className="input-field-box">
                <span className="field-prefix-icon"><HiOutlineBriefcase /></span>
                <div className="input-stack">
                  <label>Job Title</label>
                  <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Frontend Developer" required />
                </div>
              </div>

              <div className="input-field-box">
                <span className="field-prefix-icon"><HiOutlineBriefcase /></span>
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
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
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
                {submitting ? "Saving..." : editingJob ? "Update Job" : "Post Job"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;