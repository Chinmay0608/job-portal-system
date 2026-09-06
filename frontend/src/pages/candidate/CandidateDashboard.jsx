import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomSelect from "../../Components/CustomSelect";
import AIChatWidget from "../../Components/AIChatWidget";
import { getJobs, applyJob, applyExternal, getMyApplications, toggleSaveJob, getRecommendedJobs, hideJob } from "../../Services/jobService";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import RetryBanner from "../../Components/RetryBanner";
import DOMPurify from "dompurify";
import { marked } from "marked";
import "../../Styles/pages/candidate/CandidateDashboard.css";
import { FiSearch, FiMapPin, FiBookmark } from "react-icons/fi";
import { FaBookmark } from "react-icons/fa";

const JOBS_PER_PAGE = 20;
const PROFILE_NUDGE_THRESHOLD = 30;

const getRelativeTime = (dateString) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
};

  const renderExternalDescription = (text) => {
    if (!text) return null;
    let decoded = decodeHTMLEntities(text);
    
    // Heuristic: If it looks like raw markdown that lost its newlines (e.g. multiple spaces between sentences)
    // Convert multiple spaces to newlines if it starts with markdown headers.
    if (decoded.includes("##")) {
      // Replace 3+ spaces with a double newline
      decoded = decoded.replace(/\s{3,}/g, '\n\n');
      // Ensure headers have newlines before them
      decoded = decoded.replace(/(?<!\n)(#{1,6}\s)/g, '\n\n$1');
      // Ensure list items have newlines before them
      decoded = decoded.replace(/(?<!\n)(-\s)/g, '\n$1');
    }
    
    // Parse with marked. Marked will safely parse HTML tags too.
    const htmlContent = marked.parse(decoded);
    return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />;
  };

  const decodeHTMLEntities = (text) => {
  if (!text) return '';
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent;
};

const formatSalary = (salaryText, min, max, currency) => {
  if (min && max) {
    const formatShorthand = (num) => {
      if (num >= 100000) return `${currency === 'INR' || currency === '₹' ? '₹' : '$'}${num / 100000}L`;
      if (num >= 1000) return `${currency === 'INR' || currency === '₹' ? '₹' : '$'}${num / 1000}k`;
      return `${currency === 'INR' || currency === '₹' ? '₹' : '$'}${num}`;
    };
    return `${formatShorthand(min)}–${formatShorthand(max)}`;
  }
  
  if (typeof salaryText === 'string' && isNaN(Number(salaryText))) return salaryText;
  if (!salaryText || Number(salaryText) === 0) return "Competitive";
  return `₹${Number(salaryText).toLocaleString("en-IN")} a year`;
};

const capitalizeSource = (source) => {
  if (!source) return "";
  const cleaned = source.replace('SDE_', '').toLowerCase();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

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

const calculateJobMatchScore = (job, user) => {
  if (!job || !user) return { score: 75, matchedSkills: [], isDomainMatch: true };

  const userField = (user.field || "Software Engineering").toLowerCase();
  const userSkills = user.skills || [];
  const userExp = (user.experienceLevel || "Fresher").toLowerCase();

  const titleLower = (job.title || "").toLowerCase();
  const roleLower = (job.role || job.employmentType || "").toLowerCase();
  const descLower = (job.description || "").toLowerCase();
  const reqLower = Array.isArray(job.skillsRequired)
    ? job.skillsRequired.join(" ").toLowerCase()
    : String(job.skillsRequired || "").toLowerCase();

  const fullText = `${titleLower} ${roleLower} ${descLower} ${reqLower}`;

  // 1. Domain / Field Matching (Max 40 pts)
  const fieldKeywordsMap = {
    "software engineering": ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "java", "python", "javascript", "web", "sde", "code", "tech"],
    "data science & analytics": ["data", "analyst", "analytics", "scientist", "sql", "machine learning", "python", "bi", "tableau", "insights"],
    "product management": ["product", "manager", "pm", "scrum", "agile", "roadmap", "feature", "strategy"],
    "ui/ux & design": ["design", "designer", "ui", "ux", "figma", "sketch", "visual", "creative"],
    "devops & cloud": ["devops", "cloud", "aws", "sre", "docker", "kubernetes", "infrastructure", "linux", "sysadmin"],
    "marketing & growth": ["marketing", "seo", "growth", "content", "campaign", "social media", "brand"],
    "sales & bd": ["sales", "business development", "bd", "account", "revenue", "client", "deals"],
    "finance & accounting": ["finance", "accountant", "accounting", "audit", "tax", "banking", "financial"],
    "hr & operations": ["hr", "human resources", "recruiter", "talent", "people", "operations", "admin"],
    "core engineering": ["mechanical", "civil", "electrical", "hardware", "engineering", "cad", "site"]
  };

  const keywords = fieldKeywordsMap[userField] || [userField];
  const isDomainMatch = keywords.some((kw) => fullText.includes(kw));
  const domainScore = isDomainMatch ? 40 : 15;

  // 2. Skill Matching from Job Description (Max 40 pts)
  const matchedSkills = [];
  userSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    if (fullText.includes(sLower)) {
      matchedSkills.push(skill);
    }
  });

  const skillCount = userSkills.length || 1;
  const skillRatio = matchedSkills.length / skillCount;
  const skillScore = Math.min(40, Math.round(skillRatio * 40));

  // 3. Experience Match (Max 20 pts)
  let expScore = 20;
  if (userExp.includes("fresher") || userExp.includes("0-2")) {
    if (titleLower.includes("senior") || titleLower.includes("lead") || titleLower.includes("principal")) {
      expScore = 5;
    }
  }

  const rawScore = domainScore + skillScore + expScore;
  const finalScore = Math.min(98, Math.max(52, rawScore));

  return {
    score: finalScore,
    matchedSkills,
    isDomainMatch,
  };
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
  const [experienceFilter, setExperienceFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All");
  const [isRemoteFilter, setIsRemoteFilter] = useState("All");
  
  const [externalApplyActive, setExternalApplyActive] = useState(false);

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
  const fetchJobs = async ({ searchTerm, locationTerm, experienceTerm, salaryTerm, companyTerm, sourceTerm, employmentTerm, remoteTerm, page }) => {
    try {
      setJobLoadError("");
      setLoading(true);
      const response = await getJobs({
        search: searchTerm,
        location: locationTerm,
        experience: experienceTerm,
        minSalary: salaryTerm,
        source: sourceTerm,
        employmentType: employmentTerm,
        isRemote: remoteTerm === "true" ? "true" : undefined,
        page,
        limit: JOBS_PER_PAGE,
      });

      const rawJobs = response?.jobs || [];
      // Deduplicate by _id in case the API returns the same job from multiple sources
      const uniqueJobs = rawJobs.filter(
        (job, idx, arr) => arr.findIndex((j) => j._id === job._id) === idx
      );
      setJobs(uniqueJobs);
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
        sourceTerm: sourceFilter,
        employmentTerm: employmentTypeFilter,
        remoteTerm: isRemoteFilter,
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
      sourceTerm: sourceFilter,
      employmentTerm: employmentTypeFilter,
      remoteTerm: isRemoteFilter,
      page: 1,
    });
  }, [search, locationFilter, experienceFilter, salaryFilter, companyFilter, sourceFilter, employmentTypeFilter, isRemoteFilter, debouncedFetchJobs]);

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
      window.open(selectedJob.applyUrl, "_blank", "noopener,noreferrer");
      setExternalApplyActive(true);
      return;
    }

    if (user?.resume) {
      setResumeChoiceMode(true);
    } else {
      setShowApplyPanel(true);
    }
  };
  
  const handleManualTrack = async () => {
    if (!selectedJob) return;
    try {
      await applyExternal(selectedJob._id);
      setAppliedJobs((prev) => [...prev, selectedJob._id]);
      toast.success("Application tracked!");
      setExternalApplyActive(false);
    } catch (error) {
      console.error("Failed to track external application:", error);
    }
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

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsMobileDetailView(true);
    setResumeChoiceMode(false);
    setShowApplyPanel(false);
    setExternalApplyActive(false);
  };

  const availableJobs = jobs
    .filter((job) => !appliedJobs.includes(job._id))
    .filter((job, idx, arr) => arr.findIndex((j) => j._id === job._id) === idx); // dedupe
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
  }).sort((a, b) => {
    const scoreA = calculateJobMatchScore(a, user).score;
    const scoreB = calculateJobMatchScore(b, user).score;
    return scoreB - scoreA;
  });

  const rawDisplayed = activeTab === "Recommended"
    ? filteredRecommended
    : activeTab === "Saved"
    ? availableJobs.filter((job) => user?.savedJobs?.includes(job._id))
    : availableJobs;

  // Final deduplication guard — ensures no duplicate _id regardless of source
  const seen = new Set();
  const displayedJobs = rawDisplayed.filter((job) => {
    if (!job._id || seen.has(job._id)) return false;
    seen.add(job._id);
    return true;
  });

  const visibleJobs = displayedJobs;

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    resetApplyState();
    setIsMobileDetailView(true);
    setIsDescriptionExpanded(false);
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
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Candidate Dashboard</h1>
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
              <p className="eyebrow-deck">WELCOME BACK</p>
              <h2 className="ind-welcome-text-mobile">{user?.name?.split(" ")[0] || "Candidate"}</h2>
            </div>
            {/* Circular Profile Completion Ring */}
            <div 
              className="profile-completion-ring" 
              onClick={() => navigate("/candidate-profile")}
              style={{ background: `conic-gradient(#2563eb ${profileCompletion}%, #e5e7eb 0)` }}
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
          <div className="ind-search-inner mobile-collapsed-trigger" onClick={() => window.innerWidth <= 768 && setIsMobileSearchExpanded(true)}>
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
              <FiMapPin className="ind-icon" />
              <input
                type="text"
                placeholder="India"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div className="ind-input-divider desktop-only"></div>
            <div className="ind-input-wrapper desktop-only">
              <CustomSelect
                borderless
                options={[
                  { value: "", label: "All Experience" },
                  { value: "Fresher", label: "Fresher" },
                  { value: "0-2 Years", label: "0-2 Years" },
                  { value: "2-5 Years", label: "2-5 Years" },
                  { value: "5+ Years", label: "5+ Years" }
                ]}
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                placeholder="All Experience"
                className="desktop-experience-select ind-select"
              />
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
                  sourceTerm: sourceFilter,
                  employmentTerm: employmentTypeFilter,
                  remoteTerm: isRemoteFilter,
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
                  <CustomSelect
                    options={[
                      { value: "", label: "All Experience" },
                      { value: "Fresher", label: "Fresher" },
                      { value: "0-2 Years", label: "0-2 Years" },
                      { value: "2-5 Years", label: "2-5 Years" },
                      { value: "5+ Years", label: "5+ Years" }
                    ]}
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="ind-select sheet-select"
                  />
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
                      sourceTerm: sourceFilter,
                      employmentTerm: employmentTypeFilter,
                      remoteTerm: isRemoteFilter,
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
                    const matchInfo = calculateJobMatchScore(job, user);

                    return (
                      <div
                        key={job._id}
                        className={`ind-job-card ${isSelected ? "active" : ""}`}
                        onClick={() => handleJobSelect(job)}
                      >
                        <div className="card-top-row">
                          <div className="card-top-info">
                            <h4 className="ind-card-title">{job.title}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {job.companyLogo && (
                                <img 
                                  src={job.companyLogo} 
                                  alt={job.company} 
                                  style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '4px' }} 
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <p className="ind-card-company" style={{ margin: 0, color: '#6b7280', fontWeight: '500' }}>
                                {job.company} &bull; {job.location}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            className="card-bookmark-btn"
                            aria-label="Save job"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSave(job._id);
                            }}
                          >
                            {user?.savedJobs?.some((savedJobId) => savedJobId?.toString() === job?._id) ? (
                              <FaBookmark size={18} color="#2563eb" />
                            ) : (
                              <FiBookmark size={18} color="#2563eb" />
                            )}
                          </button>
                        </div>
                        
                        <div className="card-tags-group">
                          <span className="ind-card-tag" style={{
                            background: matchInfo.score >= 80 ? '#dcfce7' : '#eff6ff',
                            color: matchInfo.score >= 80 ? '#15803d' : '#1d4ed8',
                            fontWeight: '700',
                            border: matchInfo.score >= 80 ? '1px solid #bbf7d0' : '1px solid #bfdbfe'
                          }}>
                            ✨ {matchInfo.score}% Match
                          </span>

                          {job.skills && job.skills.length > 0 ? (
                            <span className="ind-card-tag skill-tag">{job.skills[0]}</span>
                          ) : (
                            <span className="ind-card-tag skill-tag">{job.isExternal ? "External" : "Internal"}</span>
                          )}
                          
                          {job.isExternal && job.source && (
                            <span className="ind-card-tag skill-tag" style={{ background: '#fef3c7', color: '#b45309' }}>
                              via {capitalizeSource(job.source)}
                            </span>
                          )}
                          
                          {job.experience && job.experience !== "Fresher" ? (
                            <span className="ind-card-tag exp-tag">{job.experience}</span>
                          ) : (
                            <span className="ind-card-tag exp-tag">Entry Level</span>
                          )}
                          
                          {hasApplied && <span className="ind-card-tag applied-tag">Applied</span>}
                        </div>
                        
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#4b5563', fontWeight: '500' }}>
                          {getRelativeTime(job.createdAt)}
                        </div>
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
                    {formatSalary(selectedJob.salary, selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}
                  </p>
                  
                  <div style={{ marginTop: '4px', marginBottom: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(() => {
                      const matchInfo = calculateJobMatchScore(selectedJob, user);
                      return (
                        <>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: matchInfo.score >= 80 ? '#dcfce7' : '#eff6ff',
                            color: matchInfo.score >= 80 ? '#15803d' : '#1d4ed8',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            border: matchInfo.score >= 80 ? '1px solid #bbf7d0' : '1px solid #bfdbfe'
                          }}>
                            ✨ {matchInfo.score}% Match ({user?.field || "Software Engineering"})
                          </span>
                          {matchInfo.matchedSkills.length > 0 && (
                            <div style={{ width: '100%', marginTop: '6px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#4b5563' }}>Matched Skills:</span>
                              {matchInfo.matchedSkills.map((sk) => (
                                <span key={sk} style={{
                                  background: '#2563eb12',
                                  color: '#2563eb',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  border: '1px solid #2563eb25'
                                }}>
                                  ✓ {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#f3f4f6',
                      color: '#374151',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      letterSpacing: '0.02em',
                      border: '1px solid #e5e7eb'
                    }}>
                      💼 <span>{selectedJob.employmentType || selectedJob.role || "Full-time"}</span>
                    </span>
                    {selectedJob.isExternal && (
                      <span style={{
                        display: 'inline-flex',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        border: '1px solid #bae6fd'
                      }}>
                        External
                      </span>
                    )}
                    {selectedJob.isExternal && selectedJob.source && (
                      <span style={{
                        display: 'inline-flex',
                        background: '#fef3c7',
                        color: '#b45309',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        border: '1px solid #fde68a'
                      }}>
                        via {capitalizeSource(selectedJob.source)}
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {getRelativeTime(selectedJob.createdAt)}
                    </span>
                  </div>

                  <div className="ind-actions-row">
                    {selectedJob.expiresAt && new Date(selectedJob.expiresAt) < new Date() ? (
                      <button className="ind-applied-status-btn" style={{background: '#fee2e2', color: '#991b1b', border: 'none'}} disabled>
                        This job is no longer available
                      </button>
                    ) : appliedJobs?.includes(selectedJob._id) ? (
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
                        {!externalApplyActive ? (
                          <button 
                            className="ind-primary-apply-btn"
                            onClick={handleApplyNowClick}
                          >
                            Apply Now
                          </button>
                        ) : (
                          <>
                            <button 
                              className="ind-primary-apply-btn"
                              style={{ background: '#10b981' }}
                              onClick={handleManualTrack}
                            >
                              Mark as Applied
                            </button>
                            <button 
                              className="ind-primary-apply-btn"
                              style={{ background: '#6b7280' }}
                              onClick={handleApplyNowClick}
                            >
                              Open Again
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleSave(selectedJob._id)}
                          style={{
                            display: "grid",
                            placeItems: "center",
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
                  
                  {/* GLASS-DOOR STYLE QUALIFICATIONS MATCH BOX */}
                  <div className="ind-qualifications-box">
                    <h4 className="ind-qualifications-heading">Your qualifications for this job</h4>
                    
                    <div className="ind-qualifications-list">
                      {selectedJob.educationRequired && (
                        <div className="ind-qualification-item">
                          <span className="ind-check-icon match">✓</span>
                          <span>{selectedJob.educationRequired}</span>
                        </div>
                      )}
                      
                      {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 ? (
                         selectedJob.skillsRequired.map((skill, idx) => {
                            const isMatch = user?.skills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                            return (
                                <div key={idx} className="ind-qualification-item">
                                  <span className={`ind-check-icon ${isMatch ? 'match' : 'unmatched'}`}>
                                    {isMatch ? '✓' : '○'}
                                  </span>
                                  <span>{skill}</span>
                                </div>
                            );
                         })
                      ) : (
                         <div className="ind-qualification-item">
                           <span className="ind-check-icon match">✓</span>
                           <span>{selectedJob.experienceRequired || "Entry Level"}</span>
                         </div>
                      )}
                    </div>
                  </div>

                  <h4 className="ind-body-section-heading" style={{ marginTop: '24px' }}>Full Job Description</h4>
                  
                  <div className={`ind-description-container ${isDescriptionExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="ind-description-content">
                      {selectedJob.isExternal ? (
                        renderExternalDescription(selectedJob.description)
                      ) : (
                        <div>
                          {selectedJob.description.split('\n').map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isDescriptionExpanded && <div className="ind-fade-overlay"></div>}
                  </div>

                  <button 
                    className="ind-show-more-btn"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  >
                    {isDescriptionExpanded ? "Show less ∧" : "Show more ∨"}
                  </button>
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
                onClick={() => navigate("/candidate-profile")}
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

      {/* FLOATING GEMINI AI CAREER COACH ASSISTANT */}
      <AIChatWidget user={user} />
    </div>
  );
}

export default CandidateDashboard;


