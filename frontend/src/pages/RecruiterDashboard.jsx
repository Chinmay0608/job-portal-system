import { useState, useEffect } from "react";
import { createJob, getRecruiterJobs, deleteJob, updateJob, getRecruiterApplications } from "../Services/jobService";
import toast from "react-hot-toast";
import "./RecruiterDashboard.css";

const initialFormState = {
  title: "",
  role: "",
  company: "",
  location: "",
  salary: "",
  description: "",
};

function RecruiterDashboard() {
  const [formData, setFormData] = useState(initialFormState);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, shortlisted: 0, rejected: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* Combined Fetch */
  const fetchDashboardData = async () => {
    await Promise.all([fetchJobs(), fetchStats()]);
  };

  /* Input Change */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* Submit Form */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.title.trim().length < 3) {
      return toast.error("Job title must be at least 3 characters");
    }
    if (Number(formData.salary) <= 0) {
      return toast.error("Salary must be greater than 0");
    }
    if (formData.description.trim().length < 15) {
      return toast.error("Description too short");
    }

    try {
      setSubmitting(true);
      let response;

      if (editingJob) {
        response = await updateJob(editingJob._id, formData);
      } else {
        response = await createJob(formData);
      }

      toast.success(response?.message || (editingJob ? "Job updated successfully" : "Job created successfully"));
      setEditingJob(null);
      setFormData(initialFormState);
      await fetchDashboardData();
    } catch (error) {
      console.error("Job Submit Error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* Fetch Jobs */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getRecruiterJobs();
      setJobs(response?.jobs || []);
    } catch (error) {
      console.error("Fetch Jobs Error:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  /* Fetch Stats */
  const fetchStats = async () => {
    try {
      const [applicationsResponse, jobsResponse] = await Promise.all([
        getRecruiterApplications(),
        getRecruiterJobs(),
      ]);

      const applications = applicationsResponse?.applications || [];
      const currentJobs = jobsResponse?.jobs || [];

      setStats({
        totalJobs: currentJobs.length,
        totalApplications: applications.length,
        shortlisted: applications.filter((app) => app.status === "shortlisted").length,
        rejected: applications.filter((app) => app.status === "rejected").length,
      });
    } catch (error) {
      console.error("Stats Error:", error);
    }
  };

  /* Delete Job */
  const handleDelete = async (jobId) => {
    try {
      const response = await deleteJob(jobId);
      toast.success(response?.message || "Job deleted");
      await fetchDashboardData();
    } catch (error) {
      console.error("Delete Job Error:", error);
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  /* Edit Job */
  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || "",
      role: job.role || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      description: job.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingJob(null);
    setFormData(initialFormState);
  };

  return (
    <div className="container-fluid recruiter-dashboard" style={{ marginTop: "110px", padding: "0 40px" }}>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-icon">📌</div>
          <div>
            <h2>{stats.totalJobs}</h2>
            <p>Total Jobs</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">👥</div>
          <div>
            <h2>{stats.totalApplications}</h2>
            <p>Applications</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">✅</div>
          <div>
            <h2>{stats.shortlisted}</h2>
            <p>Shortlisted</p>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon">❌</div>
          <div>
            <h2>{stats.rejected}</h2>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Remaining JSX (Keep same) */}
    </div>
  );
}

export default RecruiterDashboard;