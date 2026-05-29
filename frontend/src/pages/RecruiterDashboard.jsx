import {
  useEffect,
  useState,
} from "react";

import {
  getRecruiterApplications,
  updateStatus,
} from "../services/jobService";

function RecruiterDashboard() {
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

  const handleStatus =
    async (
      applicationId,
      status
    ) => {
      try {
        await updateStatus(
          applicationId,
          status
        );

        alert(
          "Status Updated"
        );

        fetchApplications();
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">
        Recruiter Dashboard
      </h1>

      <div className="row">
        {applications.map(
          (application) => (
            <div
              className="col-md-4 mb-4"
              key={
                application._id
              }
            >
              <div className="card shadow h-100 border-0">
                <div className="card-body p-4">
                  <h4 className="card-title">
                    {
                      application
                        .candidate
                        .name
                    }
                  </h4>

                  <p>
                    <strong>
                      Email:
                    </strong>{" "}
                    {
                      application
                        .candidate
                        .email
                    }
                  </p>

                  <p>
                    <strong>
                      Job:
                    </strong>{" "}
                    {
                      application
                        .job
                        .title
                    }
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    <span
                      className={`badge ${
                        application.status ===
                        "shortlisted"
                          ? "bg-success"
                          : application.status ===
                            "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {
                        application.status
                      }
                    </span>
                  </p>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-success w-100"
                      onClick={() =>
                        handleStatus(
                          application._id,
                          "shortlisted"
                        )
                      }
                    >
                      Shortlist
                    </button>

                    <button
                      className="btn btn-danger w-100"
                      onClick={() =>
                        handleStatus(
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
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default RecruiterDashboard;