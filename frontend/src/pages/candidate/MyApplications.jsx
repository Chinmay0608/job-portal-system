import { useEffect, useState } from "react";
import RetryBanner from "../../Components/RetryBanner";
import { getMyApplicationsAPI, withdrawApplication } from "../../Services/userService";
import toast from "react-hot-toast";
import BackButton from "../../components/BackButton";
import "../../Styles/pages/candidate/MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [fetchError, setFetchError] = useState("");

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

  const handleWithdraw = async (applicationId) => {
    const confirmWithdraw = window.confirm("Are you sure you want to withdraw this application?");
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

  /* Safe Resume URL Fix */
  const getResumeUrl = (resume) => {
    if (!resume) return "#";
    if (resume.startsWith("http")) return resume;
    
    // Ensures we don't accidentally get double slashes (e.g., localhost:5000//uploads)
    const baseUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
    const cleanResumePath = resume.startsWith("/") ? resume : `/${resume}`;
    
    return `${baseUrl}${cleanResumePath}`;
  };

  return (
    <div className="applications-page">
      <BackButton />
      <div className="applications-header">
        <h1>My Applications</h1>
        <p>Track your applied jobs and status</p>
      </div>

      {fetchError && <RetryBanner message={fetchError} onRetry={() => fetchApplications()} />}

      {/* Moved the grid conditional rendering to wrap ONLY the items */}
      {loading ? (
        /* Loading State - Sits beautifully outside the grid constraints */
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status" />
          <p className="mt-3 text-muted">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State - Centered and clean on the page */
        <div className="empty-applications">
          <div className="empty-icon">📄</div>
          <h2>No applications yet</h2>
          <p>Start applying to jobs and track them here.</p>
        </div>
      ) : (
        /* Applications List - Grid context applied strictly to the actual cards */
        <div className="applications-grid">
          {applications.map((application) => {
            if (!application?.job) return null;

            return (
              <div key={application._id} className="application-card">
                <div className="job-info-section">
                  <h2 className="job-name">{application.job.title}</h2>
                  <p className="company-name">{application.job.company}</p>
                  <p className="job-location">📍 {application.job.location}</p>
                  <p className="job-salary">₹ {application.job.salary}</p>
                  <p className="applied-date">
                    Applied on {new Date(application.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <div className="status-wrapper">
                  {/* Lowercasing the class ensures CSS classes like .applied or .rejected work predictably */}
                  <span className={`status-badge ${application.status?.toLowerCase()}`}>
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

                  <button
                    className="resume-btn withdraw-btn"
                    type="button"
                    disabled={deletingId === application._id}
                    onClick={() => handleWithdraw(application._id)}
                  >
                    {deletingId === application._id ? "Withdrawing..." : "Withdraw"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyApplications;