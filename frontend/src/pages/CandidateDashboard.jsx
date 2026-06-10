import { useEffect, useState } from "react";
import { getJobs, applyJob, getMyApplications } from "../Services/jobService";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./CandidateDashboard.css";

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => { fetchJobs(); fetchAppliedJobs(); }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getJobs();
      setJobs(response.jobs);
    } catch (error) {
      console.log(error);
    } finally { setLoading(false); }
  };

  const fetchAppliedJobs = async () => {
    try {
      const response = await getMyApplications();
      const appliedIds = response.applications.map((application) => application.job?._id);
      setAppliedJobs(appliedIds);
    } catch (error) { console.log(error); }
  };

  const handleApplyClick = (job) => { setSelectedJob(job); setShowModal(true); };
  const handleDetailsClick = (job) => { setSelectedJob(job); setShowDetailsModal(true); };

  const submitApplication =
  async () => {

    console.log(
      "Submit clicked"
    );

    if (!resumeFile)
      return toast.error(
        "Please upload resume"
      );

    try {

      console.log(
        "Sending request"
      );

      const formData =
        new FormData();

      formData.append(
        "resume",
        resumeFile
      );

      formData.append(
        "jobId",
        selectedJob._id
      );

      const response =
        await applyJob(
          formData
        );

      console.log(
        response
      );

      toast.success(
        response.message
      );

    } catch (error) {

      console.log(
        "ERROR:",
        error
      );

      console.log(
        error.response
      );

      toast.error(
        error.response
          ?.data
          ?.message ||
          "Application Failed"
      );
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = locationFilter === "" || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesCompany = companyFilter === "" || job.company.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesSalary = salaryFilter === "" || Number(job.salary) >= Number(salaryFilter);
    const notApplied = !appliedJobs.includes(job._id);
    return matchesSearch && matchesLocation && matchesCompany && matchesSalary && notApplied;
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Welcome back, {user?.name} 👋</h1>
          <p className="dashboard-subtitle">Find and apply to your dream opportunities</p>
        </div>
        <div className="row g-3 mt-4" style={{ maxWidth: "1100px" }}>
          <div className="col-md-4"><input type="text" placeholder="Search jobs or company..." className="form-control filter-input" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="col-md-3"><input type="text" placeholder="Location" className="form-control filter-input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} /></div>
          <div className="col-md-3"><input type="text" placeholder="Company" className="form-control filter-input" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} /></div>
          <div className="col-md-2">
            <select className="form-control filter-input" value={salaryFilter} onChange={(e) => setSalaryFilter(e.target.value)}>
              <option value="">Salary</option>
              <option value="300000">3 LPA+</option>
              <option value="500000">5 LPA+</option>
              <option value="800000">8 LPA+</option>
              <option value="1000000">10 LPA+</option>
              <option value="1500000">15 LPA+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="jobs-grid">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="skeleton-card" key={item}>
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-company"></div>
                <div className="skeleton skeleton-location"></div>
                <div className="skeleton skeleton-salary"></div>
                <div className="skeleton-buttons">
                  <div className="skeleton skeleton-btn"></div>
                  <div className="skeleton skeleton-btn"></div>
                </div>
              </div>
            ))}
          </>
        ) : filteredJobs.length === 0 ? (
          <div className="empty-wrapper">
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h2>No matching jobs found</h2>
              <p>Try changing your filters or search keywords.</p>
            </div>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div className="job-card" key={job._id}>
              <h3 className="job-title">{job.title}</h3>
              <p className="job-company">{job.company}</p>
              <p className="job-role">💼 {job.role}</p>
              <p className="job-location">📍 {job.location}</p>
              <p className="job-salary">₹{job.salary}</p>
              <div className="job-buttons">
                <button className="details-btn" onClick={() => handleDetailsClick(job)}>View Details</button>
                <button className={appliedJobs.includes(job._id) ? "applied-btn" : "apply-btn"} disabled={appliedJobs.includes(job._id)} onClick={() => handleApplyClick(job)}>
                  {appliedJobs.includes(job._id) ? "Applied" : "Apply"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      {showDetailsModal && (
        <div className="modal-overlay">
          <div className="job-details-modal">
            <button className="close-modal-btn" onClick={() => setShowDetailsModal(false)}>✕</button>
            <h1 className="details-title">{selectedJob?.title}</h1>
            <p className="details-company">{selectedJob?.company}</p>
            <div className="details-meta">
              <span>📍 {selectedJob?.location}</span>
              <span>💰 ₹{selectedJob?.salary}</span>
            </div>
            <div className="details-description">
              <h3>Job Description</h3>
              <p>{selectedJob?.description}</p>
            </div>
            <button className="apply-details-btn" onClick={() => { setShowDetailsModal(false); handleApplyClick(selectedJob); }}>Apply Now</button>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="apply-modal">
            <button className="close-modal-btn" onClick={() => { setShowModal(false); setResumeFile(null); }}>✕</button>
            <h2>Apply for {selectedJob?.title}</h2>
            <p className="modal-subtitle">{selectedJob?.company} · {selectedJob?.location}</p>
            <div className="form-group">
              <label htmlFor="resume">Upload Resume</label>
              <input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} />
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => { setShowModal(false); setResumeFile(null); }}>Cancel</button>
              <button className="submit-btn" onClick={submitApplication}>Submit Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;