import {
  useEffect,
  useState,
} from "react";

import {
  getRecruiterApplications,
  updateStatus,
} from "../Services/jobService";

function RecruiterApplications() {

  const [
    applications,
    setApplications,
  ] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications =
    async () => {

      try {

        const response =
          await getRecruiterApplications();

        setApplications(
          response.applications
        );

      } catch (error) {

        console.log(error);
      }
    };

  const handleStatusUpdate =
    async (
      applicationId,
      status
    ) => {

      try {

        await updateStatus(
          applicationId,
          status
        );

        fetchApplications();

      } catch (error) {

        console.log(error);

        alert(
          "Failed to update status"
        );
      }
    };

  return (
    <div
      className="container py-5"
      style={{
        marginTop: "90px",
      }}
    >

      <h1 className="fw-bold mb-5">
        Applicants
      </h1>

      {
        applications.length === 0 && (
          <p className="text-muted">
            No applications yet
          </p>
        )
      }

      {
        applications.map(
          (application) => (

          <div
            key={application._id}
            className="mb-4"
          >

            <div className="application-card">

              <div className="application-top">

                <div>

                  <h3 className="candidate-name">
                    {
                      application
                        ?.candidate
                        ?.name
                    }
                  </h3>

                  <p className="candidate-email">
                    {
                      application
                        ?.candidate
                        ?.email
                    }
                  </p>

                </div>

                <span
                  className={`status-badge ${application.status}`}
                >
                  {application.status}
                </span>

              </div>

              <div className="job-applied">
                Applied for:
                <strong>
                  {" "}
                  {
                    application
                      ?.job
                      ?.title
                  }
                </strong>
              </div>

              <div className="application-actions">

                {
                  application.resume && (
                    <a
                      href={
                        application.resume.startsWith("http")
                          ? application.resume
                          : `http://localhost:5000/${application.resume.replace(/^\/+/, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resume-btn"
                    >
                      View Resume
                    </a>
                  )
                }

                <button
                  className="shortlist-btn"
                  onClick={() =>
                    handleStatusUpdate(
                      application._id,
                      "shortlisted"
                    )
                  }
                >
                  Shortlist
                </button>

                <button
                  className="reject-btn"
                  onClick={() =>
                    handleStatusUpdate(
                      application._id,
                      "rejected"
                    )
                  }
                >
                  Reject
                </button>

              </div>

            </div>

          </div>
        ))
      }

    </div>
  );
}

export default RecruiterApplications;