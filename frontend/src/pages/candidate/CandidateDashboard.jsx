import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getJobs, applyJob, applyExternal, getMyApplications, toggleSaveJob, getRecommendedJobs, hideJob } from "../../Services/jobService";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import RetryBanner from "../../Components/RetryBanner";
import "../../Styles/pages/candidate/CandidateDashboard.css";
import { FiSearch, FiBookmark } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { FaBookmark } from "react-icons/fa";

const JOBS_PER_PAGE = 20;
const PROFILE_NUDGE_THRESHOLD = 30; // show nudge if completion is below this %

// Same field list used in Profile.jsx's calculateCompletion, kept identical
// so the percentage shown here always matches the Profile page exactly.
const calculateCompletion = (profileUser) => {
  const fields = [
    profileUser?.name,
    profileUser?.email,
    profileUser?.phone,
    profileUser?.location,
    profileUser?.linkedin,
    profileUser?.github,
    profileUser?.about,
    profileUser?.education,
    profileUser?.experienceLevel,
    profileUser?.skills?.length > 0,
    profileUser?.resume,
    profileUser?.profileImage,
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
};

function CandidateDashboard() {
  const [jobs, setJobs] = useState([]);
  const [recommendedJobsList, setRecommendedJobsList] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [jobLoadError, setJobLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("All Experience");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [showApplyPanel, setShowApplyPanel] = useState(false);
  
  // Consolidate list tabs (All Jobs, Recommended, Saved)
  const [activeTab, setActiveTab] = useState("All Jobs");

  // Mobile-specific UI states
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);

  // Resume reuse flow: ask the candidate whether to reuse their saved
  // profile resume, or upload a different one for this specific application.
  const [resumeChoiceMode, setResumeChoiceMode] = useState(false);
  const [useSavedResume, setUseSavedResume] = useState(null); // null | true | false
  const [fetchingSavedResume, setFetchingSavedResume] = useState(false);

  // Profile completion nudge: one-time modal shown on first dashboard visit
  // if the candidate's profile is below the completion threshold.
  const [showProfileNudge, setShowProfileNudge] = useState(false);

  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE);

  // Mobile detail view toggle
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  // Post-Apply Feedback Loop State
  const [pendingFeedbackJob, setPendingFeedbackJob] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Invalid user data:", error);
      return null;
    }
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Define all functions before useEffect hooks
  const fetchJobs = async ({ searchTerm, locationTerm, experienceTerm, salaryTerm, companyTerm, page }) => {
    try {
      setJobLoadError("");
      setLoading(true);
      const response = await getJobs({
        search: searchTerm,
        location: locationTerm,
        experience: experienceTerm,
        minSalary: salaryTerm,
        page,
        limit: JOBS_PER_PAGE,
      });

      const rawJobs = response?.jobs || [];
      setJobs(rawJobs);
      setTotalJobs(response?.totalJobs || 0);
      setTotalPages(response?.totalPages || 1);
      setCurrentPage(response?.currentPage || 1);

      if (rawJobs.length > 0) {
        setSelectedJob(rawJobs[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobLoadError("Unable to load jobs. Please check your connection and retry.");
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

  const debouncedFetchJobs = useCallback(
    debounce((params) => {
      fetchJobs(params);
    }, 400),
    []
  );

  useEffect(() => {
    const fetchAllInitialData = async () => {
      await fetchAppliedJobs();
      
      // Fetch normal jobs
      await fetchJobs({
        searchTerm: search,
        locationTerm: locationFilter,
        experienceTerm: experienceFilter,
        salaryTerm: salaryFilter,
        companyTerm: companyFilter,
        page: currentPage,
      });

      // Fetch globally recommended jobs from backend
      try {
        const response = await getRecommendedJobs();
        setRecommendedJobsList(response?.jobs || []);
      } catch (err) {
        console.error("Failed to load recommended jobs", err);
      }
    };

    fetchAllInitialData();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Profile completion nudge — runs once per account, ever, unless they
  // complete enough of their profile that it would no longer trigger.
  useEffect(() => {
    if (!user?.email) return;

    const nudgeKey = `sb_seen_profile_nudge_${user.email}`;
    const alreadySeen = localStorage.getItem(nudgeKey) === "true";
    const completion = calculateCompletion(user);

    if (!alreadySeen && completion < PROFILE_NUDGE_THRESHOLD) {
      setShowProfileNudge(true);
      localStorage.setItem(nudgeKey, "true");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state?.roleType === "remote") {
      setLocationFilter("Remote");
    } else if (location.state?.roleType === "all") {
      setLocationFilter("");
    }
  }, [location.state]);

  // Post-Apply Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && pendingFeedbackJob) {
        setTimeout(() => {
          setShowFeedbackModal(true);
        }, 500);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pendingFeedbackJob]);

  useEffect(() => {
    setCurrentPage(1);
    debouncedFetchJobs({
      searchTerm: search,
      locationTerm: locationFilter,
      experienceTerm: experienceFilter,
      salaryTerm: salaryFilter,
      companyTerm: companyFilter,
      page: 1,
    });
  }, [search, locationFilter, experienceFilter, salaryFilter, companyFilter, debouncedFetchJobs]);

  // Builds a full URL for the resume stored on the user's profile,
  // matching the same logic used in Profile.jsx's getResumeUrl.
  const getSavedResumeUrl = () => {
    const resumePath = user?.resume;
    if (!resumePath) return null;
    if (resumePath.startsWith("http")) return resumePath;
    return `${API_URL}/${resumePath.replace(/^\/+/, "")}`;
  };

  // Fetches the candidate's saved profile resume and converts it into a
  // File object, so it can be submitted through the exact same apply
  // endpoint/contract as a freshly uploaded file (no backend changes needed).
  const fetchSavedResumeAsFile = async () => {
    const url = getSavedResumeUrl();
    if (!url) return null;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Could not load saved resume");

    const blob = await response.blob();
    const fileName = url.split("/").pop() || "resume.pdf";
    return new File([blob], fileName, { type: blob.type || "application/pdf" });
  };

  const submitApplication = async (fileToSubmit) => {
    const resumeToSend = fileToSubmit || resumeFile;

    if (!resumeToSend) {
      return toast.error("Please upload your resume");
    }

    try {
      setApplying(true);
      const formData = new FormData();
      formData.append("resume", resumeToSend);
      formData.append("jobId", selectedJob?._id);

      const response = await applyJob(formData);
      toast.success(response?.message || "Application submitted successfully");

      setAppliedJobs((prev) => [...prev, selectedJob?._id]);

      // Do NOT auto-switch the job, keep the current job open so the user 
      // can see the "Applied Already" button state.
      resetApplyState();
    } catch (error) {
      console.error("Application Error:", error);
      toast.error(error?.response?.data?.message || "Application Failed");
    } finally {
      setApplying(false);
    }
  };

  const resetApplyState = () => {
    setShowApplyPanel(false);
    setResumeFile(null);
    setResumeChoiceMode(false);
    setUseSavedResume(null);
  };

  // Triggered by "Apply Now". If the job is external, redirect and await feedback.
  const handleApplyNowClick = async () => {
    if (selectedJob?.isExternal) {
      setPendingFeedbackJob(selectedJob);
      window.open(selectedJob.applyUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (user?.resume) {
      setResumeChoiceMode(true);
    } else {
      setShowApplyPanel(true);
    }
  };

  // Feedback Modal Handlers
  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setPendingFeedbackJob(null);
  };

  const handleFeedbackYes = async () => {
    if (!pendingFeedbackJob) return;
    try {
      await applyExternal(pendingFeedbackJob._id);
      setAppliedJobs((prev) => [...prev, pendingFeedbackJob._id]);
      toast.success("Great! Application tracked.");
    } catch (error) {
      console.error(error);
    }
    closeFeedbackModal();
  };

  const handleFeedbackNo = () => {
    closeFeedbackModal();
  };

  const handleFeedbackHide = async () => {
    if (!pendingFeedbackJob) return;
    try {
      await hideJob(pendingFeedbackJob._id);
      toast.success("Job hidden. You won't see this again.");
      
      setJobs((prev) => prev.filter(j => j._id !== pendingFeedbackJob._id));
      setRecommendedJobsList((prev) => prev.filter(j => j._id !== pendingFeedbackJob._id));
      
      if (selectedJob?._id === pendingFeedbackJob._id) {
        setSelectedJob(null);
        setIsMobileDetailView(false);
      }
    } catch (error) {
      toast.error("Failed to hide job");
    }
    closeFeedbackModal();
  };

  const handleToggleSave = async (jobId) => {
    if (!jobId) return;

    try {
      const response = await toggleSaveJob({ jobId });
      const updatedSavedJobs = response?.savedJobs || [];

      const updatedUser = {
        ...user,
        savedJobs: updatedSavedJobs,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Save job error:", error);
      toast.error("Could not update saved jobs");
    }
  };

  // Candidate confirmed: reuse the saved profile resume for this application.
  const handleUseSavedResume = async () => {
    try {
      setFetchingSavedResume(true);
      const file = await fetchSavedResumeAsFile();
      if (!file) {
        toast.error("Couldn't load your saved resume. Please upload one.");
        setResumeChoiceMode(false);
        setShowApplyPanel(true);
        return;
      }
      setUseSavedResume(true);
      await submitApplication(file);
    } catch (error) {
      console.error("Saved resume fetch error:", error);
      toast.error("Couldn't load your saved resume. Please upload one.");
      setResumeChoiceMode(false);
      setShowApplyPanel(true);
    } finally {
      setFetchingSavedResume(false);
    }
  };

  // Candidate declined: show the normal uploader for a different resume.
  const handleUseDifferentResume = () => {
    setUseSavedResume(false);
    setResumeChoiceMode(false);
    setShowApplyPanel(true);
  };

  const availableJobs = jobs.filter((job) => !appliedJobs.includes(job._id));
  const availableRecommended = recommendedJobsList.filter((job) => !appliedJobs.includes(job._id));

  // If user is a junior/fresher, hide explicit senior/lead roles from recommended
  const filteredRecommended = availableRecommended.filter((job) => {
    let matchesExperience = true;
    const titleLower = job.title?.toLowerCase() || "";
    const userExp = user?.experienceLevel?.toLowerCase() || "fresher";

    if (userExp === "fresher" || userExp === "0-2 years") {
      if (
        titleLower.includes("senior") || 
        titleLower.includes("lead") || 
        titleLower.includes("principal") || 
        titleLower.includes("staff") ||
        titleLower.includes("director") ||
        titleLower.includes("head")
      ) {
        matchesExperience = false;
      }
    }
    return matchesExperience;
  });

  const displayedJobs = activeTab === "Recommended"
    ? filteredRecommended
    : activeTab === "Saved"
    ? availableJobs.filter((job) => user?.savedJobs?.includes(job._id))
    : availableJobs;

  const visibleJobs = displayedJobs;

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    resetApplyState();
    setIsMobileDetailView(true);
  };

  // Reset pagination whenever the filters or the All/Recommended toggle change,
  // so a new search always starts back at the first 20 results.
  useEffect(() => {
    setVisibleCount(JOBS_PER_PAGE);
  }, [search, locationFilter, salaryFilter, companyFilter, activeTab]);

  const profileCompletion = user ? calculateCompletion(user) : 0;

  const retryFetchJobs = () => {
    fetchJobs({
      searchTerm: search,
      locationTerm: locationFilter,
      salaryTerm: salaryFilter,
      companyTerm: companyFilter,
      page: currentPage,
    });
  };

  return (
    <div className="ind-dashboard">
      {jobLoadError && (
        <div className="page-alert-wrap">
          <RetryBanner message={jobLoadError} onRetry={retryFetchJobs} />
        </div>
      )}
      
      <div className="ind-content-container">
        {/* MOBILE HEADER BLOCK (DECK theme) */}
        <div className="mobile-header-block">
          <div className="mobile-header-row">
            <div>
              <p className="eyebrow-deck">WELCOME BACK DECK</p>
              <h2 className="ind-welcome-text">Hi, {user?.name?.split(" ")[0] || "Candidate"}!</h2>
            </div>
            {/* Circular Profile Completion Ring */}
            <div 
              className="profile-completion-ring" 
              onClick={() => navigate("/profile")}
              style={{ background: `conic-gradient(#ef4444 ${profileCompletion}%, #e5e7eb 0)` }}
            >
              <div className="ring-inner">
                {profileCompletion}%
              </div>
            </div>
          </div>
          <hr className="dashed-cable-divider" />
        </div>

        {/* SEARCH CONSOLE BAR */}
        <div className="ind-search-bar">
          <div className="ind-search-inner mobile-collapsed-trigger" onClick={() => setIsMobileSearchExpanded(true)}>
            <div className="ind-input-wrapper">
              <FiSearch className="ind-icon" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                readOnly={window.innerWidth <= 768} /* Prevent keyboard pop if just opening bottom sheet */
              />
            </div>
            <div className="ind-input-divider desktop-only"></div>
            <div className="ind-input-wrapper desktop-only">
              <HiOutlineLocationMarker className="ind-icon" />
              <input
                type="text"
                placeholder="City, state, zip code, or 'remote'"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="ind-input-divider desktop-only"></div>
            <div className="ind-input-wrapper desktop-only">
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="desktop-experience-select"
              >
                <option value="All Experience">All Experience</option>
                <option value="Fresher">Fresher</option>
                <option value="0-2 Years">0-2 Years</option>
                <option value="2-5 Years">2-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>
            <button 
              className="ind-search-btn desktop-only"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(1);
                fetchJobs({
                  searchTerm: search,
                  locationTerm: locationFilter,
                  experienceTerm: experienceFilter,
                  salaryTerm: salaryFilter,
                  companyTerm: companyFilter,
                  page: 1,
                });
              }}
            >
              Find jobs
            </button>
          </div>
        </div>

        {/* MOBILE SEARCH EXPANDED VIEW (Bottom Sheet) */}
        {isMobileSearchExpanded && (
          <div className="mobile-search-overlay" onClick={() => setIsMobileSearchExpanded(false)}>
            <div className="mobile-search-sheet" onClick={e => e.stopPropagation()}>
              <div className="sheet-header">
                <h3>Search Filters</h3>
                <button className="sheet-close" onClick={() => setIsMobileSearchExpanded(false)}>✕</button>
              </div>
              <div className="sheet-body">
                <div className="sheet-input-group">
                  <FiSearch className="sheet-icon" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="sheet-input-group">
                  <HiOutlineLocationMarker className="sheet-icon" />
                  <input
                    type="text"
                    placeholder="City, state, zip code, or 'remote'"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <div className="sheet-input-group">
                  <select
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="sheet-select"
                  >
                    <option value="All Experience">All Experience</option>
                    <option value="Fresher">Fresher</option>
                    <option value="0-2 Years">0-2 Years</option>
                    <option value="2-5 Years">2-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
                <button 
                  className="ind-primary-apply-btn sheet-search-btn"
                  onClick={() => {
                    setIsMobileSearchExpanded(false);
                    setCurrentPage(1);
                    fetchJobs({
                      searchTerm: search,
                      locationTerm: locationFilter,
                      experienceTerm: experienceFilter,
                      salaryTerm: salaryFilter,
                      companyTerm: companyFilter,
                      page: 1,
                    });
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`ind-main-layout ${isMobileDetailView ? "mobile-detail-active" : ""}`}>
          {/* LEFT COLUMN: LISTING CONTAINER */}
          <div className="ind-list-column">
            
            {/* SEGMENTED CONTROL ROW */}
            <div className="segment-control-wrapper">
              <div className="segment-control">
                {["All Jobs", "Recommended", "Saved"].map(tab => (
                  <button
                    key={tab}
                    className={`segment-btn ${activeTab === tab ? "active" : ""}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
                <div 
                  className="segment-indicator" 
                  style={{ 
                    transform: `translateX(${["All Jobs", "Recommended", "Saved"].indexOf(activeTab) * 100}%)` 
                  }} 
                />
              </div>
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
                        <div className="card-top-row">
                          <div className="card-tags-group">
                            <span className="ind-card-tag">{job.isExternal ? "External" : "Internal"}</span>
                            {hasApplied && <span className="ind-card-tag applied-tag">Applied</span>}
                          </div>
                          <button
                            className="card-bookmark-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSave(job._id);
                            }}
                          >
                            {user?.savedJobs?.some((savedJobId) => savedJobId?.toString() === job?._id) ? (
                              <FaBookmark size={18} color="#ef4444" />
                            ) : (
                              <FiBookmark size={18} color="#9ca3af" />
                            )}
                          </button>
                        </div>
                        <h4 className="ind-card-title">{job.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {job.companyLogo && (
                            <img 
                              src={job.companyLogo} 
                              alt={job.company} 
                              style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} 
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <p className="ind-card-company" style={{ margin: 0 }}>{job.company}</p>
                        </div>
                        <p className="ind-card-location">{job.location}</p>

                        <div className="ind-card-salary-badge">
                          {typeof job.salary === 'string' && isNaN(Number(job.salary)) ? job.salary : `₹${Number(job.salary).toLocaleString("en-IN")} a year`}
                        </div>

                            {activeTab === "Recommended" && (
                          <div className="match-badge">
                            ⭐ Recommended
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="ind-pagination-wrapper">
                  <button
                    className="ind-pagination-btn"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      const nextPage = Math.max(1, currentPage - 1);
                      setCurrentPage(nextPage);
                      fetchJobs({
                        searchTerm: search,
                        locationTerm: locationFilter,
                        experienceTerm: experienceFilter,
                        salaryTerm: salaryFilter,
                        companyTerm: companyFilter,
                        page: nextPage,
                      });
                    }}
                  >
                    Previous
                  </button>
                  <span className="ind-pagination-info">
                    Page {currentPage} of {totalPages} • {totalJobs} jobs
                  </span>
                  <button
                    className="ind-pagination-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      const nextPage = Math.min(totalPages, currentPage + 1);
                      setCurrentPage(nextPage);
                      fetchJobs({
                        searchTerm: search,
                        locationTerm: locationFilter,
                        salaryTerm: salaryFilter,
                        companyTerm: companyFilter,
                        page: nextPage,
                      });
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: DETAIL WORKSPACE */}
          <div className="ind-detail-column">
            {selectedJob ? (
              <div className="ind-detail-sticky-wrapper">
                <div className="ind-detail-header-card">
                  <button 
                    className="mobile-back-btn"
                    onClick={() => setIsMobileDetailView(false)}
                  >
                    ← Back to Jobs
                  </button>
                  <h3 className="ind-detail-main-title">{selectedJob.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedJob.companyLogo && (
                      <img 
                        src={selectedJob.companyLogo} 
                        alt={selectedJob.company} 
                        style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }} 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <p className="ind-detail-company-link" style={{ margin: 0 }}>{selectedJob.company}</p>
                  </div>
                  <p className="ind-detail-location-text">{selectedJob.location}</p>
                  <p className="ind-detail-salary-text">
                    {typeof selectedJob.salary === 'string' && isNaN(Number(selectedJob.salary)) ? selectedJob.salary : `₹${Number(selectedJob.salary).toLocaleString("en-IN")} a year`}
                  </p>
                  
                  <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#f3f4f6',
                      color: '#374151',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      letterSpacing: '0.02em',
                      border: '1px solid #e5e7eb'
                    }}>
                      💼 {selectedJob.role || "Full-time"}
                    </span>
                  </div>

                  <div className="ind-actions-row">
                    {appliedJobs?.includes(selectedJob._id) ? (
                      <button className="ind-applied-status-btn" disabled>
                        Applied Already
                      </button>
                    ) : resumeChoiceMode ? (
                      // Ask whether to reuse the saved profile resume or upload a different one
                      <div className="ind-resume-choice-box">
                        <p className="ind-resume-choice-text">
                          Use your saved resume for this application?
                        </p>
                        <div className="ind-resume-choice-actions">
                          <button
                            className="ind-resume-choice-yes"
                            onClick={handleUseSavedResume}
                            disabled={fetchingSavedResume}
                          >
                            {fetchingSavedResume ? "Loading..." : "Yes, use saved resume"}
                          </button>
                          <button
                            className="ind-resume-choice-no"
                            onClick={handleUseDifferentResume}
                            disabled={fetchingSavedResume}
                          >
                            No, upload different
                          </button>
                        </div>
                      </div>
                    ) : showApplyPanel ? (
                      <div className="ind-inline-uploader-box">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files[0])}
                        />
                        <button 
                          className="ind-inline-submit-btn" 
                          onClick={() => submitApplication()}
                          disabled={applying}
                        >
                          {applying ? "Sending..." : "Submit Application"}
                        </button>
                        <button 
                          className="ind-inline-cancel-btn"
                          onClick={resetApplyState}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <button 
                          className="ind-primary-apply-btn"
                          onClick={handleApplyNowClick}
                        >
                          Apply Now
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSave(selectedJob._id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 42,
                            height: 42,
                            border: "1px solid rgba(0,0,0,0.12)",
                            borderRadius: 12,
                            background: "transparent",
                            color: user?.savedJobs?.some(
                              (savedJobId) => savedJobId?.toString() === selectedJob?._id
                            )
                              ? "#e0245e"
                              : "#333",
                            cursor: "pointer",
                            padding: 0,
                          }}
                          aria-label={
                            user?.savedJobs?.some(
                              (savedJobId) => savedJobId?.toString() === selectedJob?._id
                            )
                              ? "Unsave job"
                              : "Save job"
                          }
                        >
                          {user?.savedJobs?.some(
                            (savedJobId) => savedJobId?.toString() === selectedJob?._id
                          ) ? (
                            <FaBookmark size={18} />
                          ) : (
                            <FiBookmark size={18} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ind-detail-scroll-body">
                  <h4 className="ind-body-section-heading">Full Job Description</h4>
                  <div className="ind-description-content">
                    {selectedJob.isExternal ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedJob.description }} />
                    ) : (
                      <p>{selectedJob.description}</p>
                    )}
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

      {/* ONE-TIME PROFILE COMPLETION NUDGE MODAL */}
      {showProfileNudge && (
        <div className="ind-nudge-overlay" onClick={() => setShowProfileNudge(false)}>
          <div className="ind-nudge-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="ind-nudge-close"
              onClick={() => setShowProfileNudge(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <span className="ind-nudge-icon">📋</span>
            <h3 className="ind-nudge-title">Complete your profile to get matched</h3>
            <p className="ind-nudge-text">
              Your profile is only <strong>{profileCompletion}% complete</strong>.
              Add a few more details — like your skills and resume — so we can
              recommend jobs that actually fit you.
            </p>

            <div className="ind-nudge-progress-bar">
              <div
                className="ind-nudge-progress-fill"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            <div className="ind-nudge-actions">
              <button
                className="ind-nudge-primary-btn"
                onClick={() => navigate("/profile")}
              >
                Complete my profile
              </button>
              <button
                className="ind-nudge-ghost-btn"
                onClick={() => setShowProfileNudge(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST-APPLY FEEDBACK MODAL */}
      {showFeedbackModal && pendingFeedbackJob && (
        <div className="ind-nudge-overlay" onClick={closeFeedbackModal}>
          <div className="ind-nudge-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <span className="ind-nudge-icon">👋</span>
            <h3 className="ind-nudge-title">Welcome back!</h3>
            <p className="ind-nudge-text">
              Did you apply for the <strong>{pendingFeedbackJob.title}</strong> role at {pendingFeedbackJob.company}?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button 
                className="ind-primary-apply-btn" 
                onClick={handleFeedbackYes}
                style={{ width: "100%" }}
              >
                Yes, I applied
              </button>
              <button 
                className="ind-nudge-ghost-btn" 
                onClick={handleFeedbackNo}
                style={{ width: "100%" }}
              >
                No, I didn't apply
              </button>
              <button 
                onClick={handleFeedbackHide}
                style={{ width: "100%", background: "transparent", color: "#dc2626", border: "1px solid #fca5a5", padding: "12px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
              >
                Not a fit / Hide this job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDashboard;