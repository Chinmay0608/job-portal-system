import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getJobs, applyJob, getMyApplications } from "../../Services/jobService";
import toast from "react-hot-toast";
import "../../Styles/pages/candidate/CandidateDashboard.css";
import { FiSearch } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";

const JOBS_PER_PAGE = 20;

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [showApplyPanel, setShowApplyPanel] = useState(false);
  const [showRecommended, setShowRecommended] = useState(false);

  // Pagination: how many jobs are currently visible in the list
  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE);

  const location = useLocation();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Invalid user data:", error);
  }

  useEffect(() => {
    const initDashboard = async () => {
      await fetchAppliedJobs();
      await fetchJobs();
    };
    initDashboard();
  }, []);

  useEffect(() => {
    if (location.state?.roleType === "remote") {
      setLocationFilter("Remote");
    } else if (location.state?.roleType === "all") {
      setLocationFilter("");
    }
  }, [location.state]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getJobs();
      const rawJobs = response?.jobs || [];
      setJobs(rawJobs);
      
      if (rawJobs.length > 0) {
        setSelectedJob(rawJobs[0]);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const response = await getMyApplications();
      const appliedIds = response?.applications?.map((app) => app?.job?._id) || [];
      setAppliedJobs(appliedIds);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const submitApplication = async () => {
    if (!resumeFile) {
      return toast.error("Please upload your resume");
    }

    try {
      setApplying(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobId", selectedJob?._id);

      const response = await applyJob(formData);
      toast.success(response?.message || "Application submitted successfully");

      setAppliedJobs((prev) => [...prev, selectedJob?._id]);

      const nextJob = displayedJobs.find(
        (job) => job._id !== selectedJob?._id
      );
      setSelectedJob(nextJob || null);

      setShowApplyPanel(false);
      setResumeFile(null);
    } catch (error) {
      console.error("Application Error:", error);
      toast.error(error?.response?.data?.message || "Application Failed");
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job?.title?.toLowerCase().includes(search.toLowerCase()) ||
      job?.company?.toLowerCase().includes(search.toLowerCase());

    const matchesLocation = !locationFilter || job?.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesCompany = !companyFilter || job?.company?.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesSalary = !salaryFilter || Number(job?.salary) >= Number(salaryFilter);

    return matchesSearch && matchesLocation && matchesCompany && matchesSalary;
  });

  const availableJobs = filteredJobs.filter(
    (job) => !appliedJobs.includes(job._id)
  );

  const recommendedJobs = availableJobs.filter((job) => {
    const description = job.description?.toLowerCase() || "";

    const commonSkills = [
      "react",
      "node",
      "mongodb",
      "express",
      "javascript",
      "java",
      "spring",
      "python",
      "sql",
      "mysql",
      "aws",
      "docker",
      "kubernetes",
      "html",
      "css",
      "tailwind",
      "typescript",
    ];

    return commonSkills.some((skill) =>
      description.includes(skill)
    );
  });

  const displayedJobs = showRecommended
    ? recommendedJobs
    : availableJobs;

  // Only render the first `visibleCount` jobs in the list
  const visibleJobs = displayedJobs.slice(0, visibleCount);
  const hasMoreJobs = visibleCount < displayedJobs.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + JOBS_PER_PAGE);
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setShowApplyPanel(false);
    setResumeFile(null);
  };

  // Reset pagination whenever the filters or the All/Recommended toggle change,
  // so a new search always starts back at the first 20 results.
  useEffect(() => {
    setVisibleCount(JOBS_PER_PAGE);
  }, [search, locationFilter, salaryFilter, companyFilter, showRecommended]);

  return (
    <div className="ind-dashboard">
      {/* SEARCH CONSOLE BAR */}
      <div className="ind-search-bar">
        <div className="ind-search-inner">
          <div className="ind-input-wrapper">
            <FiSearch className="ind-icon" />
            <input
              type="text"
              placeholder="Job title, keywords, or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ind-input-divider"></div>
          <div className="ind-input-wrapper">
            <HiOutlineLocationMarker className="ind-icon" />
            <input
              type="text"
              placeholder="City, state, zip code, or 'remote'"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </div>
          <button className="ind-search-btn">Find jobs</button>
        </div>
      </div>

      <div className="ind-content-container">
        <h2 className="ind-welcome-text">Welcome, {user?.name || "Candidate"}</h2>

        <div className="ind-main-layout">
          {/* LEFT COLUMN: LISTING CONTAINER */}
          <div className="ind-list-column">
            <div className="jobs-toggle">
              <button
                className={!showRecommended ? "active" : ""}
                onClick={() => setShowRecommended(false)}
              >
                All Jobs
              </button>

              <button
                className={showRecommended ? "active" : ""}
                onClick={() => setShowRecommended(true)}
              >
                Recommended
              </button>
            </div>
            <h3 className="ind-section-title">Jobs for you</h3>

            {loading ? (
              <div className="ind-loader-box">
                <div className="ind-spinner"></div>
                <p>Loading your matches...</p>
              </div>
            ) : displayedJobs.length === 0 ? (
              <div className="ind-empty-box">
                <span>📭</span>
                <h4>No matching listings found</h4>
                <p>Try modifying your parameters above.</p>
              </div>
            ) : (
              <>
                <div className="ind-cards-stack">
                  {visibleJobs.map((job) => {
                    const isSelected = selectedJob?._id === job._id;
                    const hasApplied = appliedJobs.includes(job._id);

                    return (
                      <div
                        key={job._id}
                        className={`ind-job-card ${isSelected ? "active" : ""}`}
                        onClick={() => handleJobSelect(job)}
                      >
                        <div className="ind-card-tag">Easily apply</div>
                        <h4 className="ind-card-title">{job.title}</h4>
                        <p className="ind-card-company">{job.company}</p>
                        <p className="ind-card-location">{job.location}</p>

                        <div className="ind-card-salary-badge">
                          ₹{Number(job.salary).toLocaleString("en-IN")} a year
                        </div>

                            {showRecommended && (
                          <div className="match-badge">
                            ⭐ Recommended
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {hasMoreJobs && (
                  <div className="ind-load-more-wrapper">
                    <button
                      className="ind-load-more-btn"
                      onClick={handleLoadMore}
                    >
                      Load more jobs
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: DETAIL WORKSPACE */}
          <div className="ind-detail-column">
            {selectedJob ? (
              <div className="ind-detail-sticky-wrapper">
                <div className="ind-detail-header-card">
                  <h3 className="ind-detail-main-title">{selectedJob.title}</h3>
                  <p className="ind-detail-company-link">{selectedJob.company}</p>
                  <p className="ind-detail-location-text">{selectedJob.location}</p>
                  <p className="ind-detail-salary-text">
                    ₹{Number(selectedJob.salary).toLocaleString("en-IN")} a year
                  </p>

                  <div className="ind-actions-row">
                    {appliedJobs.includes(selectedJob._id) ? (
                      <button className="ind-applied-status-btn" disabled>
                        Applied Already
                      </button>
                    ) : showApplyPanel ? (
                      <div className="ind-inline-uploader-box">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files[0])}
                        />
                        <button 
                          className="ind-inline-submit-btn" 
                          onClick={submitApplication}
                          disabled={applying}
                        >
                          {applying ? "Sending..." : "Submit Application"}
                        </button>
                        <button 
                          className="ind-inline-cancel-btn"
                          onClick={() => setShowApplyPanel(false)}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="ind-primary-apply-btn"
                        onClick={() => setShowApplyPanel(true)}
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>

                <div className="ind-detail-scroll-body">
                  <h4 className="ind-body-section-heading">Job details</h4>
                  
                  <div className="ind-meta-item">
                    <span className="ind-meta-label">💼 Job Type</span>
                    <span className="ind-meta-val">{selectedJob.role || "Full-time"}</span>
                  </div>

                  <hr className="ind-body-divider" />

                  <h4 className="ind-body-section-heading">Full Job Description</h4>
                  <div className="ind-description-content">
                    <p>{selectedJob.description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ind-no-selection-placeholder">
                <p>Select a job listing entry to view comprehensive insights here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateDashboard;