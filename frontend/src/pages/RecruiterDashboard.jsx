import { useState, useEffect } from "react";
import {  createJob, getRecruiterJobs, deleteJob} from "../services/jobService";

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

  const [jobs, setJobs,] = useState([]);

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

    useEffect(() => {
  fetchJobs();
}, []);

const fetchJobs =
  async () => {

    try {

      const response =
        await getRecruiterJobs();

      setJobs(
        response.jobs
      );

    } catch (
      error
    ) {

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

    } catch (
      error
    ) {

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

  return (
    <div
      className="container py-5"
      style={{
        marginTop: "90px",
      }}
    >

      <div
        className="
          recruiter-card
          mx-auto
        "
        style={{
          maxWidth:
            "620px",
        }}
      >

        <h1
          className="
            recruiter-title
          "
        >
          Create Job
        </h1>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <label className="mb-2 fw-semibold">
            Job Title
          </label>

          <input
            type="text"
            name="title"
            placeholder="Enter job title"
            className="
              form-control
              mb-3
              recruiter-input
            "
            value={
              formData.title
            }
            onChange={
              handleChange
            }
            required
          />

          <label className="mb-2 fw-semibold">
            Company
          </label>

          <input
            type="text"
            name="company"
            placeholder="Enter company name"
            className="
              form-control
              mb-3
              recruiter-input
            "
            value={
              formData.company
            }
            onChange={
              handleChange
            }
            required
          />

          <label className="mb-2 fw-semibold">
            Location
          </label>

          <input
            type="text"
            name="location"
            placeholder="Enter location"
            className="
              form-control
              mb-3
              recruiter-input
            "
            value={
              formData.location
            }
            onChange={
              handleChange
            }
            required
          />

          <label className="mb-2 fw-semibold">
            Salary
          </label>

          <input
            type="number"
            name="salary"
            placeholder="Enter salary"
            className="
              form-control
              mb-3
              recruiter-input
            "
            value={
              formData.salary
            }
            onChange={
              handleChange
            }
            required
          />

          <label className="mb-2 fw-semibold">
            Description
          </label>

          <textarea
            name="description"
            placeholder="Describe the role..."
            className="
              form-control
              mb-4
              recruiter-input
            "
            rows="5"
            value={
              formData.description
            }
            onChange={
              handleChange
            }
            required
          />

          <button
            className="btn btn-dark w-100 py-3 create-job-btn"
            type="submit"
          >
            Create Job
          </button>

        </form>

        <hr className="my-5" />

        <h2 className="mb-4 fw-bold">
          My Posted Jobs
        </h2>

        <div className="row">

          {jobs.map((job) => (

            <div
              key={job._id}
              className="col-12 mb-3"
            >

              <div className="card p-4 border-0 shadow-sm"
                style={{
                  borderRadius:
                    "20px",
                }}
              >

                <h4 className="fw-bold">
                  {job.title}
                </h4>

                <p>
                  {job.company}
                </p>

                <p>
                  {job.location}
                </p>

                <p className="fw-bold text-success">
                  ₹{job.salary}
                </p>

                <button className="btn btn-danger w-100 mt-2"
                  onClick={() =>
                    handleDelete(
                      job._id
                    )}
                >
                  Delete Job
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;