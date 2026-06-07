import { useEffect, useState } from "react";
import { getMyApplications } from "../Services/jobService";
import "./MyApplications.css";

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

      } catch (error) {

        console.log(error);
      }
    };

  return (
    <div className="applications-page">

      <div className="applications-header">

        <h1>
          My Applications
        </h1>

        <p>
          Track your applied
          jobs and status
        </p>

      </div>

      <div className="applications-grid">

        {applications.length === 0 ? (

          <div className="empty-applications">

            <div className="empty-icon">
              📄
            </div>

            <h2>
              No applications yet
            </h2>

            <p>
              Start applying to
              jobs and track them
              here.
            </p>

          </div>

        ) : (

          applications.map(
            (application) => {

              if (
                !application.job
              )
                return null;

              return (

                <div
                  key={
                    application._id
                  }
                  className="application-card"
                >

                  <div>

                    <h2 className="job-name">
                      {
                        application.job
                          .title
                      }
                    </h2>

                    <p className="company-name">
                      {
                        application.job
                          .company
                      }
                    </p>

                    <p className="job-location">
                      📍
                      {
                        application.job
                          .location
                      }
                    </p>

                    <p className="job-salary">
                      ₹
                      {
                        application.job
                          .salary
                      }
                    </p>

                  </div>

                  <div className="status-wrapper">

                    <span
                      className={`status-badge ${application.status}`}
                    >
                      {
                        application.status
                      }
                    </span>

                  </div>

                </div>
              );
            }
          )
        )}

      </div>

    </div>
  );
}

export default MyApplications;