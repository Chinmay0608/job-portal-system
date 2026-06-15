import { useEffect, useState } from "react";
import { getMyApplications } from "../Services/jobService";
import toast from "react-hot-toast";
import "../Styles/pages/MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getMyApplications();
      setApplications(response?.applications || []);
    } catch (error) {
      console.error("Applications Error:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  /* Resume URL Fix */
  const getResumeUrl = (resume) => {
    if (!resume) return "#";
    if (resume.startsWith("http")) return resume;
    return `${API_URL}/${resume}`;
  };

  return (
    <div className="applications-page">
      <div className="applications-header">
        <h1>My Applications</h1>
        <p>Track your applied jobs and status</p>
      </div>

      <div className="applications-grid">
        {/* Loading State */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-dark" role="status" />
            <p className="mt-3 text-muted">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          /* Empty State */
          <div className="empty-applications">
            <div className="empty-icon">📄</div>
            <h2>No applications yet</h2>
            <p>Start applying to jobs and track them here.</p>
          </div>
        ) : (
          /* Applications List */
          applications.map((application) => {
            if (!application?.job) return null;

            return (
              <div key={application._id} className="application-card">
                <div>
                  <h2 className="job-name">{application.job.title}</h2>
                  <p className="company-name">{application.job.company}</p>
                  <p className="job-location">📍 {application.job.location}</p>
                  <p className="job-salary">₹ {application.job.salary}</p>
                  <p className="applied-date">
                    Applied on {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="status-wrapper">
                  <span className={`status-badge ${application.status}`}>
                    {application.status}
                  </span>

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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MyApplications;