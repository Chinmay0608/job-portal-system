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
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <div>
      <h1>
        My Applications
      </h1>

      {applications.map(
        (application) => (
          <div
            key={
              application._id
            }
          >
            <h2>
              {
                application
                  .job
                  .title
              }
            </h2>

            <p>
              Company:
              {
                application
                  .job
                  .company
              }
            </p>

            <p>
              Location:
              {
                application
                  .job
                  .location
              }
            </p>

            <p>
              Status:
              {
                application.status
              }
            </p>

            <hr />
          </div>
        )
      )}
    </div>
  );
}

export default MyApplications;