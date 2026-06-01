import { useEffect, useState } from "react";
import {
  getJobs,
  applyJob,
} from "../services/jobService";

import { useNavigate }
from "react-router-dom";

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
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

  const handleApply = async (jobId) => {
    try {

      const response =
        await applyJob(
          jobId
        );

      alert(
        response.message
      );

      setAppliedJobs(
        (prev) => [
          ...prev,
          jobId
        ]
      );

    } catch (error) {

      console.log(
        error
      );

      alert(
        error.response.data
          .message
      );
    }
  };

  const filteredJobs =
  jobs.filter(
    (job) =>
      job.title
        .toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||
      job.company
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

  return (
    <div className="container mt-5">

      <div  className="text-center mb-5"
        style={{
          marginTop: "120px",
        }}
      >
        <h1>
          Available Jobs
        </h1>

        <input
          type="text"
          placeholder="Search jobs or company..."
          className="
            form-control
            mb-4
            mx-auto
          "
          style={{
            maxWidth: "500px",
            borderRadius: "14px",
            padding: "12px",
          }}
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <h4 className="text-muted">
          Welcome, {user?.name}
        </h4>
      </div>

      <div className="row justify-content-center">
        {filteredJobs.length ===
          0 && (
            <h4 className="text-muted">
              No jobs found
            </h4>
        )}
        {filteredJobs.map((job) => (
          <div
            className="col-md-4 mb-4"
            key={job._id}
          >
            <div className="card shadow-sm h-100 border-0"
              style={{
                borderRadius: "24px",
              }}
            >
              <div className="card-body p-4 d-flex flex-column">
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
                  className={ appliedJobs.includes(job._id)
                      ? "btn btn-success w-100 mt-3"
                      : "btn btn-primary w-100 mt-3"
                  }

                  disabled={ appliedJobs.includes(job._id)}
                  onClick={() => handleApply(job._id)}
                >
                  {appliedJobs.includes(
                    job._id
                  )
                    ? "Applied"
                    : "Apply"}
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