import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJobs, applyJob, getMyApplications } from "../Services/jobService";
import toast from "react-hot-toast";
import "./CandidateDashboard.css";

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  // Modals / Selection
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  const navigate = useNavigate();

  /* Safe User Parsing */
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Invalid user data:", error);
  }

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
  }, []);

  /* Fetch Jobs */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getJobs();
      setJobs(response?.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  /* Fetch Applied Jobs */
  const fetchAppliedJobs = async () => {
    try {
      const response = await getMyApplications();
      const appliedIds = response?.applications?.map((app) => app?.job?._id) || [];
      setAppliedJobs(appliedIds);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  /* Open Apply Modal */
  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  /* Open Details Modal */
  const handleDetailsClick = (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
  };

  /* Submit Application */
  const submitApplication = async () => {
    if (!resumeFile) {
      return toast.error("Please upload resume");
    }

    try {
      setApplying(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobId", selectedJob?._id);

      const response = await applyJob(formData);
      toast.success(response?.message || "Application submitted successfully");

      setAppliedJobs((prev) => [...prev, selectedJob?._id]);
      closeModal();
    } catch (error) {
      console.error("Application Error:", error);
      toast.error(error?.response?.data?.message || "Application Failed");
    } finally {
      setApplying(false);
    }
  };

  /* Close Modal */
  const closeModal = () => {
    setShowModal(false);
    setSelectedJob(null);
    setResumeFile(null);
  };

  /* Filter Jobs */
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job?.title?.toLowerCase().includes(search.toLowerCase()) ||
      job?.company?.toLowerCase().includes(search.toLowerCase());

    const matchesLocation = !locationFilter || job?.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesCompany = !companyFilter || job?.company?.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesSalary = !salaryFilter || Number(job?.salary) >= Number(salaryFilter);
    const notApplied = !appliedJobs.includes(job?._id);

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

        {/* Filters */}
        <div className="row g-3 mt-4" style={{ maxWidth: "1100px" }}>
          <div className="col-md-4">
            <input
              type="text"
              placeholder="Search jobs or company..."
              className="form-control filter-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input
              type="text"
              placeholder="Location"
              className="form-control filter-input"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <input
              type="text"
              placeholder="Company"
              className="form-control filter-input"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <select
              className="form-control filter-input"
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
            >
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

      {/* Remaining JSX (Jobs Grid + Modals) */}
      {/* Keep same as your current code */}
    </div>
  );
}

export default CandidateDashboard;