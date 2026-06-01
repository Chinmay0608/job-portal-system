import { useEffect, useState } from "react";
import {
  getRecruiterApplications,
  updateStatus,
} from "../services/jobService";

function RecruiterApplications() {

  const [applications, setApplications] =
    useState([]);

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

        fetchApplications();
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <div
      className="container py-5"
      style={{
        marginTop: "90px",
      }}
    >
      <h1 className="text-center mb-5">
        Applicants
      </h1>

      <div className="row">
        {applications.map(
          (application) => (
            <div
              key={application._id}
              className="col-md-4 mb-4"
            >
              <div className="card p-4 shadow border-0">

                <h4>
                  {
                    application
                      .candidate
                      .name
                  }
                </h4>

                <p>
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
                      ?.title
                  }
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {
                    application
                      .status
                  }
                </p>

                <div className="d-flex gap-2">

                  <button
                    className="btn btn-success w-50"
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
                    className="btn btn-danger w-50"
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
          )
        )}
      </div>
    </div>
  );
}

export default RecruiterApplications;