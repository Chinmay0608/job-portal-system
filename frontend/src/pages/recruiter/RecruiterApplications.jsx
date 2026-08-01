import { useEffect, useState } from "react";
import { getRecruiterApplications, updateStatus } from "../../Services/jobService";
import RetryBanner from "../../Components/RetryBanner";
import toast from "react-hot-toast";
import BackButton from "../../Components/BackButton";
import "../../Styles/pages/recruiter/RecruiterApplications.css";

function RecruiterApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchApplications();
  }, []);

  /* Fetch Applications */
  const fetchApplications = async () => {
    try {
      setFetchError("");
      setLoading(true);
      const response = await getRecruiterApplications();
      setApplications(response?.applications || []);
    } catch (error) {
      console.error("Fetch Applications Error:", error);
      setFetchError("Unable to load applicants. Please check your connection and retry.");
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

  const openDetailModal = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedApplication(null);
    setShowDetailModal(false);
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
      <BackButton />
      {/* Header */}
      <div className="applications-header">
        <h1>Applicants</h1>
        <p>Review candidates and manage hiring decisions</p>
      </div>

      {fetchError && <RetryBanner message={fetchError} onRetry={fetchApplications} />}
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

                <button
                  type="button"
                  className="details-btn"
                  onClick={() => openDetailModal(application)}
                >
                  View Details
                </button>

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

      {showDetailModal && selectedApplication && (
        <div className="application-modal-overlay" onClick={closeDetailModal}>
          <div className="application-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Applicant details</h3>
                <p className="modal-subtitle">Review candidate info and take action</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeDetailModal}
                aria-label="Close details modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <span className="modal-label">Candidate</span>
                <p>{selectedApplication.candidate?.name || "-"}</p>
                <p className="modal-meta">{selectedApplication.candidate?.email || "No email available"}</p>
              </div>

              <div className="modal-section">
                <span className="modal-label">Applied for</span>
                <p>{selectedApplication.job?.title || "-"}</p>
                <p className="modal-meta">{selectedApplication.job?.company || ""}</p>
              </div>

              <div className="modal-grid-row">
                <div className="modal-section">
                  <span className="modal-label">Location</span>
                  <p>{selectedApplication.job?.location || "N/A"}</p>
                </div>
                <div className="modal-section">
                  <span className="modal-label">Salary</span>
                  <p>₹ {selectedApplication.job?.salary || "N/A"}</p>
                </div>
              </div>

              <div className="modal-section">
                <span className="modal-label">Application status</span>
                <span className={`status-badge ${selectedApplication.status}`}>
                  {selectedApplication.status}
                </span>
              </div>

              <div className="modal-section">
                <span className="modal-label">Applied on</span>
                <p>{new Date(selectedApplication.createdAt).toLocaleDateString("en-IN")}</p>
              </div>

              <div className="modal-section">
                <span className="modal-label">Job description</span>
                <p className="job-description">
                  {selectedApplication.job?.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              {selectedApplication.resume && (
                <a
                  href={getResumeUrl(selectedApplication.resume)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-btn"
                >
                  Open Resume
                </a>
              )}
              {selectedApplication.status === "pending" && (
                <div className="modal-action-buttons">
                  <button
                    type="button"
                    className="shortlist-btn"
                    onClick={() => handleStatusUpdate(selectedApplication._id, "shortlisted")}
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    className="reject-btn"
                    onClick={() => handleStatusUpdate(selectedApplication._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterApplications;