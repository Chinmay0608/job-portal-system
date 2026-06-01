import {
  useEffect,
  useState,
} from "react";

import {
  getMyApplications,
} from "../services/jobService";

function MyApplications() {

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
          await getMyApplications();

        setApplications(
          response.applications
        );

      } catch (
        error
      ) {

        console.log(
          error
        );
      }
    };

  return (
    <div
      className="container py-5"
      style={{
        marginTop:
          "90px",
      }}
    >

      <h1
        className="
          text-center
          fw-bold
          mb-5
        "
      >
        My Applications
      </h1>

      <div className="row">

        {applications.map(
          (
            application
          ) => {

            if (
              !application.job
            ) {
              return null;
            }

            return (
              <div
                key={
                  application._id
                }
                className="
                  col-md-4
                  mb-4
                "
              >

                <div
                  className="
                    card
                    border-0
                    shadow-sm
                    p-4
                    h-100
                  "
                  style={{
                    borderRadius:
                      "24px",
                  }}
                >

                  <h3 className="fw-bold">
                    {
                      application
                        .job
                        .title
                    }
                  </h3>

                  <p>
                    <strong>
                      Company:
                    </strong>{" "}
                    {
                      application
                        .job
                        .company
                    }
                  </p>

                  <p>
                    <strong>
                      Location:
                    </strong>{" "}
                    {
                      application
                        .job
                        .location
                    }
                  </p>

                  <p className="
                    fw-bold
                    text-success
                  ">
                    ₹
                    {
                      application
                        .job
                        .salary
                    }
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}

                    <span
                      className={`
                        badge
                        ${
                          application.status ===
                          "shortlisted"
                            ? "bg-success"
                            : application.status ===
                              "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                        }
                      `}
                    >
                      {
                        application
                          .status
                      }
                    </span>
                  </p>

                </div>
              </div>
            );
          }
        )}

      </div>
    </div>
  );
}

export default MyApplications;