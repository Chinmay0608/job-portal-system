import { useState, useEffect } from "react";
import "./RecruiterDashboard.css";

import {
  createJob,
  getRecruiterJobs,
  deleteJob,
  updateJob,
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
    editingJob,
    setEditingJob,
  ] = useState(null);

  useEffect(() => {
    fetchJobs();
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

        let response;

        if (editingJob) {

          response =
            await updateJob(
              editingJob._id,
              formData
            );

        } else {

          response =
            await createJob(
              formData
            );
        }

        alert(
          response.message
        );

        fetchJobs();

        setEditingJob(
          null
        );

        setFormData({
          title: "",
          company: "",
          location: "",
          salary: "",
          description: "",
        });

      } catch (error) {

        console.log(error);

        alert(
          error.response
            ?.data
            ?.message ||
            "Something went wrong"
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

        console.log(error);
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

        console.log(error);

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
      className="
        container-fluid
        recruiter-dashboard
      "
      style={{
        marginTop:
          "110px",
        padding:
          "0 40px",
      }}
    >

      <div className="row g-4">

        {/* LEFT SIDE */}
        <div className="col-lg-5">

          <div className="recruiter-card">

            <h1 className="
              recruiter-title
              mb-4
            ">
              {editingJob
                ? "Edit Job"
                : "Create Job"}
            </h1>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <input
                type="text"
                name="title"
                placeholder="Job Title"
                className="
                  form-control
                  mb-3
                "
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="text"
                name="company"
                placeholder="Company"
                className="
                  form-control
                  mb-3
                "
                value={
                  formData.company
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="text"
                name="location"
                placeholder="Location"
                className="
                  form-control
                  mb-3
                "
                value={
                  formData.location
                }
                onChange={
                  handleChange
                }
                required
              />

              <input
                type="number"
                name="salary"
                placeholder="Salary"
                className="
                  form-control
                  mb-3
                "
                value={
                  formData.salary
                }
                onChange={
                  handleChange
                }
                required
              />

              <textarea
                name="description"
                placeholder="Job Description"
                className="
                  form-control
                  mb-4
                "
                rows="4"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                required
              />

              <div className="
                d-flex
                gap-2
              ">

                <button
                  className="
                    create-job-btn
                    w-100
                    py-3
                  "
                  type="submit"
                >
                  {editingJob
                    ? "Update Job"
                    : "Create Job"}
                </button>

                {editingJob && (

                  <button
                    type="button"
                    className="
                      cancel-edit-btn
                    "
                    onClick={() => {

                      setEditingJob(
                        null
                      );

                      setFormData({
                        title: "",
                        company: "",
                        location: "",
                        salary: "",
                        description: "",
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-lg-7">

          {/* MY JOBS */}
          <div className="mb-5">

            <h2 className="
              fw-bold
              mb-4
              section-title
            ">
              My Posted Jobs
            </h2>

            <div className="row">

              {jobs.map(
                (job) => (

                <div
                  key={job._id}
                  className="
                    col-md-6
                    mb-4
                  "
                >
                  <div className="job-card">

                    <h4 className="fw-bold">
                      {job.title}
                    </h4>

                    <p className="
                      text-muted
                      mb-2
                    ">
                      {job.company}
                    </p>

                    <p>
                      📍 {job.location}
                    </p>

                    <h4 className="
                      salary-text
                    ">
                      ₹{job.salary}
                    </h4>

                    <div className="
                      d-flex
                      gap-2
                      mt-3
                    ">

                      <button
                        className="
                          btn
                          btn-dark
                          w-50
                        "
                        onClick={() => {

                          setEditingJob(
                            job
                          );

                          setFormData({
                            title:
                              job.title,
                            company:
                              job.company,
                            location:
                              job.location,
                            salary:
                              job.salary,
                            description:
                              job.description,
                          });
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className="
                          btn
                          btn-danger
                          w-50
                        "
                        onClick={() =>
                          handleDelete(
                            job._id
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

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