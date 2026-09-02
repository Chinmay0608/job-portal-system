import { useEffect, useState } from "react";
import RetryBanner from "../../Components/RetryBanner";
import { getMyApplicationsAPI, withdrawApplication } from "../../Services/userService";
import toast from "react-hot-toast";
import BackButton from "../../Components/BackButton";
import { Link } from "react-router-dom";
import "../../Styles/pages/candidate/MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter] = useState("All");

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setFetchError("");
      setLoading(true);
      const response = await getMyApplicationsAPI();
      setApplications(response?.applications || []);
    } catch (error) {
      console.error("Applications Error:", error);
      setFetchError("Unable to load applications. Please try again.");
      toast.error("Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId, jobTitle) => {
    const confirmWithdraw = window.confirm(`Withdraw your application for ${jobTitle}?`);
    if (!confirmWithdraw) return;

    try {
      setDeletingId(applicationId);
      await withdrawApplication(applicationId);
      setApplications((prev) => prev.filter((app) => app._id !== applicationId));
      toast.success("Application withdrawn successfully");
    } catch (error) {
      console.error("Withdraw Error:", error);
      toast.error(error?.response?.data?.message || "Failed to withdraw application");
    } finally {
      setDeletingId(null);
    }
  };

  const getResumeUrl = (resume) => {
    if (!resume) return "#";
    if (resume.startsWith("http")) return resume;
    const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
    const cleanResumePath = resume.startsWith("/") ? resume : `/${resume}`;
    return `${baseUrl}${cleanResumePath}`;
  };

  const formatSalary = (job) => {
    if (!job.salary) return "Not specified";
    const raw = String(job.salary);
    // If it's not purely numeric (already has '$' or 'k', etc), return as is
    if (isNaN(Number(raw))) return raw;
    
    // Otherwise it's purely a number
    const formattedNum = Number(raw).toLocaleString("en-US");
    if (job.salaryCurrency === 'INR') return `₹${formattedNum}`;
    if (job.salaryCurrency === 'USD') return `$${formattedNum}`;
    if (job.salaryCurrency) return `${job.salaryCurrency} ${formattedNum}`;
    return formattedNum;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const filteredApplications = applications.filter(app => {
    if (filter === "All") return true;
    return app.status?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="applications-page">
      <BackButton />
      <div className="applications-header">
        <h1>My Applications</h1>
        <p>Track your applied jobs and status</p>
      </div>

      {/* TABS (Item 7 & 8) */}
      {!loading && applications.length > 0 && (
        <div className="applications-tabs">
          {["All", "Pending", "Shortlisted", "Selected", "Rejected"].map(tab => (
            <button
              key={tab}
              className={`app-tab-btn ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {fetchError && <RetryBanner message={fetchError} onRetry={() => fetchApplications()} />}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status" />
          <p className="mt-3 text-muted">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-applications">
          <div className="empty-icon">📁</div>
          <h2>You haven't applied to any jobs yet</h2>
          <p>Start applying to jobs and track them here.</p>
          <Link to="/candidate-dashboard" className="browse-jobs-btn">Browse Jobs</Link>
        </div>
      ) : (
        <div className="applications-list-container">
          <div className="applications-grid">
            {filteredApplications.map((application) => {
              if (!application?.job) return null;

              return (
                <div key={application._id} className="application-card">
                  <div className="job-info-section">
                    <div className="job-header-row">
                      {/* Avatar / Logo (Item 2) */}
                      {application.job.companyLogo ? (
                        <img src={application.job.companyLogo} alt="Logo" className="company-avatar" />
                      ) : (
                        <div className="company-avatar fallback">
                          {application.job.company?.charAt(0) || "C"}
                        </div>
                      )}
                      
                      <div className="job-title-group">
                        <h2 className="job-name">{application.job.title}</h2>
                        <div className="company-meta-row">
                          <p className="company-name">{application.job.company}</p>
                          {/* External Badge (Item 3) */}
                          {application.job.isExternal && (
                            <span className="external-badge">
                              External 
                              {application.job.source && application.job.source !== 'INTERNAL' 
                                ? ` • via ${application.job.source}` 
                                : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="job-location">📍 {application.job.location}</p>
                    {/* Fixed currency bug (Item 1) */}
                    <p className="job-salary">{formatSalary(application.job)}</p>
                    <p className="applied-date">
                      Applied on {formatDate(application.createdAt)}
                    </p>
                  </div>

                  <div className="status-wrapper">
                    {/* READ-ONLY status badge — only recruiters can change application status */}
                    <span className={`status-badge ${application.status?.toLowerCase()}`}>
                      {application.status
                        ? application.status.charAt(0).toUpperCase() + application.status.slice(1).replace(/_/g, " ")
                        : "Pending"}
                    </span>

                    <div className="action-buttons">
                      {application.resume && (
                        <a
                          href={getResumeUrl(application.resume)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="resume-btn"
                        >
                          View Resume
                        </a>
                      )}
                      
                      {/* Outlined Withdraw button (Item 5) */}
                      <button
                        className="withdraw-btn-outline"
                        onClick={() => handleWithdraw(application._id, application.job.title)}
                        disabled={deletingId === application._id}
                      >
                        {deletingId === application._id ? "..." : "Withdraw"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredApplications.length === 0 && filter !== "All" && (
              <div className="empty-applications" style={{gridColumn: '1 / -1', minHeight: '30vh'}}>
                <h2>No {filter.toLowerCase()} applications</h2>
                <p>You don't have any applications with this status.</p>
              </div>
            )}
          </div>
          
          {/* Global Browse Jobs CTA (Item 6) */}
          <div className="browse-more-container">
            <Link to="/candidate-dashboard" className="browse-jobs-btn-secondary">Explore More Jobs</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyApplications;