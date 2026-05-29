import { useEffect, useState } from "react";
import {
  getJobs,
  applyJob,
} from "../services/jobService";

import { useNavigate }
from "react-router-dom";

function CandidateDashboard() {
  const [jobs, setJobs] =
    useState([]);

  const navigate =
    useNavigate();

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

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
    <div className="container mt-5">

      <div className="text-center mb-5">
        <h1>
          Available Jobs
        </h1>

        <h4 className="text-muted">
          Welcome, {user?.name}
        </h4>

        <button
          className="btn btn-primary mt-3 px-4"
          onClick={() =>
            navigate(
              "/my-applications"
            )
          }
        >
          My Applications
        </button>
      </div>

      <div className="row justify-content-center">
        {jobs.map((job) => (
          <div
            className="col-md-4 mb-4"
            key={job._id}
          >
            <div className="card shadow h-100 border-0">
              <div className="card-body p-4">
                <h4 className="card-title fw-bold">
                  {job.title}
                </h4>

                <p>
                  <strong>
                    Company:
                  </strong>{" "}
                  {job.company}
                </p>

                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {job.location}
                </p>

                <p className="text-success fw-bold fs-5 mt-3">
                  ₹{job.salary}
                </p>

                <button
                  className="btn btn-primary w-100 mt-3"
                  onClick={() =>
                    handleApply(
                      job._id
                    )
                  }
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default CandidateDashboard;