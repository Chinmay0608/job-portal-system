import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./RecruiterApplications.css";
import { getRecruiterApplications, updateStatus } from "../Services/jobService";

function RecruiterApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications =
  async () => {

    try {

      setLoading(
        true
      );

      const response =
        await getRecruiterApplications();

      setApplications(
        response.applications
      );

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(
        false
      );
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await updateStatus(applicationId, status);
      fetchApplications();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="applications-page">
      <div className="applications-header">
        <h1>Applicants</h1>
        <p>Review candidates and manage hiring decisions</p>
      </div>

      {
        loading && (

          <div
            className="
              text-center
              py-5
            "
          >

            <div
              className="
                spinner-border
                text-dark
              "
              role="status"
            />

            <p
              className="
                mt-3
                text-muted
              "
            >
              Loading applicants...
            </p>

          </div>
        )
      }

      {!loading && applications.length === 0 ? (
        <div className="empty-applications">
          <div className="empty-icon">👥</div>
          <h2>No applications yet</h2>
          <p>Candidate applications will appear here.</p>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((application) => (
            <div key={application._id} className="application-card">
              <div className="application-top">
                <div>
                  <h2 className="candidate-name">{application?.candidate?.name}</h2>
                  <p className="candidate-email">{application?.candidate?.email}</p>
                </div>
                <span className={`status-badge ${application.status}`}>{application.status}</span>
              </div>

              <div className="job-applied">
                Applied for <strong> {application?.job?.title}</strong>
              </div>

              <div className="application-actions">
                {application.resume && (
                  <a
                    href={application.resume.startsWith("http") ? application.resume : `http://localhost:5000/${application.resume.replace(/^\/+/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resume-btn"
                  >
                    View Resume
                  </a>
                )}
                <button className="shortlist-btn" onClick={() => handleStatusUpdate(application._id, "shortlisted")}>Shortlist</button>
                <button className="reject-btn" onClick={() => handleStatusUpdate(application._id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecruiterApplications;