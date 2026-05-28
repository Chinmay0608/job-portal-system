import { useEffect, useState } from "react";
import {
  getJobs,
  applyJob,
} from "../services/jobService";

import { useNavigate } from "react-router-dom";

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs =
    async () => {
      try {
        const response =
          await getJobs();

        setJobs(
          response.jobs
        );
      } catch (error) {
        console.log(error);
      }
    };

  const handleApply =
    async (jobId) => {
      try {
        const response =
          await applyJob(
            jobId
          );

        alert(
          response.message
        );
      } catch (error) {
        console.log(error);

        alert(
          error.response.data
            .message
        );
      }
    };

  return (
    <div>
      <h1>
        Available Jobs
      </h1>

      <button
        onClick={() =>
          navigate(
            "/my-applications"
          )
        }
      >
        My Applications
      </button>

      {jobs.map((job) => (
        <div key={job._id}>
          <h2>
            {job.title}
          </h2>

          <p>
            Company: {job.company}
          </p>

          <p>
            Location: {job.location}
          </p>

          <p>
            Salary: ₹{job.salary}
          </p>

          <button
            onClick={() =>
              handleApply(
                job._id
              )
            }
          >
            Apply
          </button>

          <hr />
        </div>
      ))}
    </div>
  );
}

export default CandidateDashboard;