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
    <div>
      <h1>
        Recruiter Dashboard
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
                  .candidate
                  .name
              }
            </h2>

            <p>
              Email:
              {
                application
                  .candidate
                  .email
              }
            </p>

            <p>
              Job:
              {
                application
                  .job
                  .title
              }
            </p>

            <p>
              Status:
              {
                application
                  .status
              }
            </p>

            <button
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
              onClick={() =>
                handleStatus(
                  application._id,
                  "rejected"
                )
              }
            >
              Reject
            </button>

            <hr />
          </div>
        )
      )}
    </div>
  );
}

export default RecruiterDashboard;