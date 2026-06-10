import { useState, useEffect } from "react";
import "./RecruiterDashboard.css";
import toast from "react-hot-toast";
import { createJob, getRecruiterJobs, deleteJob, updateJob, getRecruiterApplications } from "../Services/jobService";

function RecruiterDashboard() {
  const [formData, setFormData] = useState({ title: "", role: "", company: "", location: "", salary: "", description: "" });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, shortlisted: 0, rejected: 0 });
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => { fetchJobs(); fetchStats(); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.trim().length < 3) return toast.error("Job title must be at least 3 characters");
    if (Number(formData.salary) <= 0) return toast.error("Salary must be greater than 0");
    if (formData.description.trim().length < 15) return toast.error("Description too short");

    try {
      let response;
      if (editingJob) {
        response = await updateJob(editingJob._id, formData);
      } else {
        response = await createJob(formData);
      }
      toast.success(response.message);
      fetchJobs();
      setEditingJob(null);
      setFormData({ title: "", role: "", company: "", location: "", salary: "", description: "" });
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getRecruiterJobs();
      setJobs(response.jobs);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getRecruiterApplications();
      const applications = response.applications;
      const jobsResponse = await getRecruiterJobs();

      setStats({
        totalJobs: jobsResponse.jobs.length,
        totalApplications: applications.length,
        shortlisted: applications.filter((app) => app.status === "shortlisted").length,
        rejected: applications.filter((app) => app.status === "rejected").length,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (jobId) => {
    try {
      const response = await deleteJob(jobId);
      toast.success(response.message);
      fetchJobs();
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="container-fluid recruiter-dashboard" style={{ marginTop: "110px", padding: "0 40px" }}>
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-icon">📌</div>
          <div><h2>{stats.totalJobs}</h2><p>Total Jobs</p></div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">👥</div>
          <div><h2>{stats.totalApplications}</h2><p>Applications</p></div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">✅</div>
          <div><h2>{stats.shortlisted}</h2><p>Shortlisted</p></div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">❌</div>
          <div><h2>{stats.rejected}</h2><p>Rejected</p></div>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT SIDE */}
        <div className="col-lg-5">
          <div className="recruiter-card">
            <h1 className="recruiter-title mb-4">{editingJob ? "Edit Job" : "Create Job"}</h1>
            <form onSubmit={handleSubmit}>
              <input type="text" name="title" placeholder="Job Title" className="form-control mb-3" value={formData.title} onChange={handleChange} required />
              <select name="role" className="form-control mb-3" value={formData.role} onChange={handleChange} required>
                <option value="">Select Role</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Data Analyst">Data Analyst</option>
              </select>
              <input type="text" name="company" placeholder="Company" className="form-control mb-3" value={formData.company} onChange={handleChange} required />
              <input type="text" name="location" placeholder="Location" className="form-control mb-3" value={formData.location} onChange={handleChange} required />
              <input type="number" name="salary" placeholder="Salary" className="form-control mb-3" value={formData.salary} onChange={handleChange} required />
              <textarea name="description" placeholder="Job Description" className="form-control mb-4" rows="4" value={formData.description} onChange={handleChange} required />
              <div className="d-flex gap-2">
                <button className="create-job-btn w-100 py-3" type="submit">{editingJob ? "Update Job" : "Create Job"}</button>
                {editingJob && (
                  <button type="button" className="cancel-edit-btn" onClick={() => { setEditingJob(null); setFormData({ title: "", role: "", company: "", location: "", salary: "", description: "" }); }}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-lg-7">
          <div className="mb-5">
            <h2 className="fw-bold mb-4 section-title">My Posted Jobs</h2>
            <div className="row">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-dark" role="status" />
                  <p className="mt-3 text-muted">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-5">
                  <h5 className="text-muted">No jobs posted yet</h5>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job._id} className="col-md-6 mb-4">
                    <div className="job-card">
                      <h4 className="fw-bold">{job.title}</h4>
                      <p className="text-muted mb-2">{job.company}</p>
                      <p className="job-role">💼 {job.role}</p>
                      <p>📍 {job.location}</p>
                      <h4 className="salary-text">₹{job.salary}</h4>
                      <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-dark w-50" onClick={() => { setEditingJob(job); setFormData({ title: job.title, role: job.role, company: job.company, location: job.location, salary: job.salary, description: job.description }); }}>Edit</button>
                        <button className="btn btn-danger w-50" onClick={() => handleDelete(job._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;