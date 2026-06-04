import { useState, useEffect } from "react";

import {
  createJob,
  getRecruiterJobs,
  deleteJob,
  getRecruiterApplications,
  updateStatus,
} from "../Services/jobService";

function RecruiterDashboard() {

  const [
    formData,
    setFormData,
  ] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    description: "",
  });

  const [jobs, setJobs] =
    useState([]);

  const [
    applications,
    setApplications,
  ] = useState([]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const handleChange =
    (e) => {
      setFormData({
        ...formData,
        [e.target.name]:
          e.target.value,
      });
    };

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        const response =
          await createJob(
            formData
          );

        alert(
          response.message
        );

        fetchJobs();

        setFormData({
          title: "",
          company: "",
          location: "",
          salary: "",
          description: "",
        });

      } catch (error) {

        console.log(
          error
        );

        alert(
          error.response
            ?.data
            ?.message ||
            "Error creating job"
        );
      }
    };

  const fetchJobs =
    async () => {

      try {

        const response =
          await getRecruiterJobs();

        setJobs(
          response.jobs
        );

      } catch (error) {

        console.log(
          error
        );
      }
    };

  const fetchApplications =
    async () => {

      try {

        const response =
          await getRecruiterApplications();

        setApplications(
          response.applications
        );

      } catch (error) {

        console.log(
          error
        );
      }
    };

  const handleDelete =
    async (jobId) => {

      try {

        const response =
          await deleteJob(
            jobId
          );

        alert(
          response.message
        );

        fetchJobs();

      } catch (error) {

        console.log(
          error
        );

        alert(
          error.response
            ?.data
            ?.message ||
            "Delete failed"
        );
      }
    };

    const handleStatusUpdate =
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

          alert(
            "Failed to update status"
          );
        }
      };

  return (
    <div
      className="container-fluid recruiter-dashboard"
      style={{
        marginTop: "110px",
        padding: "0 40px",
      }}
    >
      <div className="row g-4">

        {/* LEFT SIDE - CREATE JOB */}
        <div className="col-lg-5">

          <div className="recruiter-card">

            <h1 className="recruiter-title mb-4">
              Create Job
            </h1>

            <form onSubmit={handleSubmit}>

              <input
                type="text"
                name="title"
                placeholder="Job Title"
                className="form-control mb-3"
                value={formData.title}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="company"
                placeholder="Company"
                className="form-control mb-3"
                value={formData.company}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="location"
                placeholder="Location"
                className="form-control mb-3"
                value={formData.location}
                onChange={handleChange}
                required
              />

              <input
                type="number"
                name="salary"
                placeholder="Salary"
                className="form-control mb-3"
                value={formData.salary}
                onChange={handleChange}
                required
              />

              <textarea
                name="description"
                placeholder="Job Description"
                className="form-control mb-4"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                required
              />

              <button
                className="create-job-btn w-100 py-3"
                type="submit"
              >
                Create Job
              </button>

            </form>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-lg-7">

          {/* MY JOBS */}
          <div className="mb-5">
            <h2 className="fw-bold mb-4 section-title">
              My Posted Jobs
            </h2>

            <div className="row">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="col-md-6 mb-4"
                >
                  <div className="job-card">

                    <h4 className="fw-bold">
                      {job.title}
                    </h4>

                    <p className="text-muted mb-2">
                      {job.company}
                    </p>

                    <p>
                      📍 {job.location}
                    </p>

                    <h4 className="salary-text">
                      ₹{job.salary}
                    </h4>

                    <button
                      className="btn btn-danger w-100 mt-3"
                      onClick={() =>
                        handleDelete(job._id)
                      }
                    >
                      Delete Job
                    </button>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;