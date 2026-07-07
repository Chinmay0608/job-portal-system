import { useEffect, useState } from "react";
import { getRecruiterApplications, updateStatus } from "../../Services/jobService";
import toast from "react-hot-toast";
import "../../Styles/pages/recruiter/RecruiterApplications.css";

function RecruiterApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchApplications();
  }, []);

  /* Fetch Applications */
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getRecruiterApplications();
      setApplications(response?.applications || []);
    } catch (error) {
      console.error("Fetch Applications Error:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  /* Resume URL Fix */
  const getResumeUrl = (resume) => {
    if (!resume) return "#";
    if (resume.startsWith("http")) return resume;
    return `${API_URL}/${resume.replace(/^\/+/, "")}`;
  };

  /* Update Status */
  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await updateStatus(applicationId, status);
      toast.success(`Candidate ${status}`);
      fetchApplications();
    } catch (error) {
      console.error("Status Update Error:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="applications-page">
      {/* Header */}
      <div className="applications-header">
        <h1>Applicants</h1>
        <p>Review candidates and manage hiring decisions</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status" />
          <p className="mt-3 text-muted">Loading applicants...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="empty-applications">
          <div className="empty-icon">👥</div>
          <h2>No applications yet</h2>
          <p>Candidate applications will appear here.</p>
        </div>
      ) : (
        /* Applications Grid */
        <div className="applications-grid">
          {applications.map((application) => (
            <div key={application._id} className="application-card">
              <div className="application-top">
                <div>
                  <h2 className="candidate-name">{application?.candidate?.name}</h2>
                  <p className="candidate-email">{application?.candidate?.email}</p>
                </div>
                <span className={`status-badge ${application.status}`}>
                  {application.status}
                </span>
              </div>

              <div className="job-applied">
                Applied for <strong>{application?.job?.title}</strong>
              </div>

              <div className="application-actions">
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

                {application.status === "pending" ? (
                  <>
                    <button
                      className="shortlist-btn"
                      onClick={() =>
                        handleStatusUpdate(application._id, "shortlisted")
                      }
                    >
                      Shortlist
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() =>
                        handleStatusUpdate(application._id, "rejected")
                      }
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <div
                    className={`decision-pill ${
                      application.status === "shortlisted"
                        ? "decision-shortlisted"
                        : "decision-rejected"
                    }`}
                  >
                    {application.status === "shortlisted"
                      ? "✓ Candidate Shortlisted"
                      : "✕ Candidate Rejected"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecruiterApplications;