import { useEffect, useState } from "react";
import { getJobs, applyJob } from "../Services/jobService";
import { useNavigate } from "react-router-dom";
import "./CandidateDashboard.css";

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [companyFilter,setCompanyFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const response = await getJobs();
      setJobs(response.jobs);
    } catch (error) { console.log(error); }
  };

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const submitApplication = async () => {
    if (!resumeFile) return alert("Please upload resume");
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobId", selectedJob._id);

      const response = await applyJob(formData);
      alert(response.message);

      setAppliedJobs((prev) => [...prev, selectedJob._id]);
      setShowModal(false);
      setResumeFile(null);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Application Failed");
    }
  };

  const filteredJobs =
    jobs.filter((job) => {

      const matchesSearch =
        job.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        job.company
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesLocation =
        locationFilter === "" ||

        job.location
          .toLowerCase()
          .includes(
            locationFilter.toLowerCase()
          );

      const matchesCompany =
        companyFilter === "" ||

        job.company
          .toLowerCase()
          .includes(
            companyFilter.toLowerCase()
          );

      const matchesSalary =
        salaryFilter === "" ||

        Number(job.salary) >=
        Number(salaryFilter);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCompany &&
        matchesSalary
      );
    });

  return (
    <div className="dashboard-container">

      {/* Header */}
      <div className="dashboard-header">

        <div>
          <h1 className="dashboard-title">
            Welcome back,
            {user?.name} 👋
          </h1>

          <p className="dashboard-subtitle">
            Find and apply to your
            dream opportunities
          </p>
        </div>
        <div
          className="row g-3 mt-4"
          style={{
            maxWidth: "1100px",
          }}
        >

          {/* Search */}
          <div className="col-md-4">
            <input
              type="text"
              placeholder="Search jobs or company..."
              className="form-control filter-input"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>

          {/* Location */}
          <div className="col-md-3">
            <input
              type="text"
              placeholder="Location"
              className="form-control filter-input"
              value={locationFilter}
              onChange={(e) =>
                setLocationFilter(
                  e.target.value
                )
              }
            />
          </div>

          {/* Company */}
          <div className="col-md-3">
            <input
              type="text"
              placeholder="Company"
              className="form-control filter-input"
              value={companyFilter}
              onChange={(e) =>
                setCompanyFilter(
                  e.target.value
                )
              }
            />
          </div>

          {/* Salary */}
          <div className="col-md-2">
            <select
              className="form-control filter-input"
              value={salaryFilter}
              onChange={(e) =>
                setSalaryFilter(
                  e.target.value
                )
              }
            >
              <option value="">
                Salary
              </option>

              <option value="300000">
                3 LPA+
              </option>

              <option value="500000">
                5 LPA+
              </option>

              <option value="800000">
                8 LPA+
              </option>

              <option value="1000000">
                10 LPA+
              </option>

              <option value="1500000">
                15 LPA+
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div className="jobs-grid">

        {filteredJobs.length === 0 && (
          <h4 className="text-muted">
            No jobs found
          </h4>
        )}

        {filteredJobs.map((job) => (
          <div
            className="job-card"
            key={job._id}
          >

            <h3 className="job-title">
              {job.title}
            </h3>

            <p className="job-company">
              {job.company}
            </p>

            <p className="job-location">
              📍 {job.location}
            </p>

            <p className="job-salary">
              ₹{job.salary}
            </p>

            <button
              className={
                appliedJobs.includes(
                  job._id
                )
                  ? "applied-btn"
                  : "apply-btn"
              }

              disabled={
                appliedJobs.includes(
                  job._id
                )
              }

              onClick={() =>
                handleApplyClick(job)
              }
            >
              {appliedJobs.includes(
                job._id
              )
                ? "Applied"
                : "Apply"}
            </button>

          </div>
        ))}
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="modal-overlay">

          <div className="apply-modal">

            <h2>
              Apply for
              <br />
              {selectedJob?.title}
            </h2>

            <p className="modal-subtitle">
              Upload your resume to
              continue
            </p>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="form-control"
              onChange={(e) =>
                setResumeFile(
                  e.target.files[0]
                )
              }
            />

            <div className="modal-buttons">

              <button
                className="cancel-btn"
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

              <button
                className="submit-btn"
                onClick={
                  submitApplication
                }
              >
                Submit
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;