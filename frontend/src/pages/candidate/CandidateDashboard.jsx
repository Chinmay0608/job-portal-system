import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomSelect from "../../Components/CustomSelect";
import OnboardingWizard from "../../Components/OnboardingWizard";
import { getJobs, applyJob, applyExternal, getMyApplications, toggleSaveJob, getRecommendedJobs, hideJob, getUserProfile } from "../../Services/jobService";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import RetryBanner from "../../Components/RetryBanner";
import DOMPurify from "dompurify";
import { marked } from "marked";
import StatusBadge from "../../Components/common/StatusBadge";
import EmptyState from "../../Components/common/EmptyState";
import { JobCardSkeleton } from "../../Components/common/SkeletonLoader";
import { FiSearch, FiMapPin, FiBookmark } from "react-icons/fi";
import { FaBookmark } from "react-icons/fa";
import workChatSvg from "../../assets/undraw_work-chat_kw8x.svg";
import {
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  notifyMessagesUpdated,
} from "../../Services/messageService";
import {
  Shield as ShieldIcon,
  AlertTriangle as AlertTriangleIcon,
  Megaphone as MegaphoneIcon,
  Clock as ClockIcon,
  Info as InfoIcon,
  X as CloseIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

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
    "software engineering": ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "java", "python", "javascript", "sde", "programmer", "coder", "software engineer", "web developer"],
    "data science & analytics": ["data scientist", "data analyst", "analytics", "data science", "machine learning", "tableau", "power bi", "deep learning", "sql analyst"],
    "product management": ["product manager", "product management", "scrum master", "product owner", "agile coach"],
    "ui/ux & design": ["ui/ux", "ux designer", "ui designer", "graphic designer", "figma", "visual designer", "product designer"],
    "devops & cloud": ["devops", "cloud engineer", "sre", "kubernetes", "docker", "aws", "sysadmin", "infrastructure engineer"],
    "marketing & growth": ["marketing", "growth hacker", "seo", "content writer", "social media", "digital marketing", "brand manager", "mba"],
    "sales & bd": ["sales", "business development", "account executive", "sales manager", "bde", "sales representative"],
    "finance & accounting": ["finance", "accountant", "accounting", "auditor", "financial analyst", "tax consultant"],
    "hr & operations": ["hr", "human resources", "recruiter", "talent acquisition", "people operations", "operations manager"],
    "core engineering": ["mechanical engineer", "civil engineer", "electrical engineer", "hardware engineer", "cad designer"]
  };

  const keywords = fieldKeywordsMap[userField] || [userField];
  const isDomainMatch = keywords.some((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(fullText);
  });
  const domainScore = isDomainMatch ? 40 : 0;

  // 2. Skill Matching from Job Description (Max 40 pts)
  const matchedSkills = [];
  userSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    const escaped = sLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(fullText)) {
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
  const finalScore = isDomainMatch ? Math.min(98, Math.max(50, rawScore)) : Math.max(20, rawScore);

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

  // Official Admin Communications & Announcements State
  const [officialMessages, setOfficialMessages] = useState([]);
  const [selectedOfficialMessage, setSelectedOfficialMessage] = useState(null);
  const [unreadOfficialCount, setUnreadOfficialCount] = useState(0);
  const [officialFilter, setOfficialFilter] = useState("all"); // "all" | "unread"
  const [loadingOfficialMessages, setLoadingOfficialMessages] = useState(false);
  const [showUrgentBanner, setShowUrgentBanner] = useState(true);

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
  const fetchJobs = async ({ searchTerm, locationTerm, experienceTerm, salaryTerm, companyTerm, sourceTerm, employmentTerm, remoteTerm, field, page }) => {
    try {
      setJobLoadError("");
      setLoading(true);
      const effectiveField = field !== undefined ? field : user?.field;
      const response = await getJobs({
        search: searchTerm,
        location: locationTerm,
        experience: experienceTerm,
        minSalary: salaryTerm,
        source: sourceTerm,
        employmentType: employmentTerm,
        isRemote: remoteTerm === "true" ? "true" : undefined,
        field: effectiveField,
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
    [user?.field]
  );

  const handleOnboardingComplete = async (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    try {
      const recRes = await getRecommendedJobs();
      setRecommendedJobsList(recRes?.jobs || []);
    } catch (err) {
      console.error("Failed to refresh recommended jobs after onboarding:", err);
    }
    fetchJobs({
      searchTerm: search,
      locationTerm: locationFilter,
      experienceTerm: experienceFilter,
      salaryTerm: salaryFilter,
      companyTerm: companyFilter,
      sourceTerm: sourceFilter,
      employmentTerm: employmentTypeFilter,
      remoteTerm: isRemoteFilter,
      field: updatedUser?.field,
      page: 1,
    });
  };

  useEffect(() => {
    const fetchAllInitialData = async () => {
      let currentUser = user;
      // Sync fresh user profile to ensure hasCompletedOnboarding is accurate
      try {
        const profileRes = await getUserProfile();
        if (profileRes?.user) {
          currentUser = profileRes.user;
          setUser(profileRes.user);
          localStorage.setItem("user", JSON.stringify(profileRes.user));
        }
      } catch (err) {
        console.error("Failed to sync user profile on mount:", err);
      }

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
        field: currentUser?.field,
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
  // We only show this after onboarding has been completed.
  useEffect(() => {
    if (!user?.email || !user?.hasCompletedOnboarding) return;

    const nudgeKey = `sb_seen_profile_nudge_${user.email}`;
    const alreadySeen = localStorage.getItem(nudgeKey) === "true";
    const completion = calculateCompletion(user);

    if (!alreadySeen && completion < PROFILE_NUDGE_THRESHOLD) {
      setShowProfileNudge(true);
      localStorage.setItem(nudgeKey, "true");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hasCompletedOnboarding]);

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
      field: user?.field,
      page: 1,
    });
  }, [search, locationFilter, experienceFilter, salaryFilter, companyFilter, sourceFilter, employmentTypeFilter, isRemoteFilter, user?.field, debouncedFetchJobs]);




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

      if (response?.user) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
      }

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

  // Triggered by "Apply Now". If the job is external, redirect and auto-track in My Applications.
  const handleApplyNowClick = async () => {
    if (selectedJob?.isExternal) {
      window.open(selectedJob.applyUrl, "_blank", "noopener,noreferrer");
      try {
        await applyExternal(selectedJob._id);
        setAppliedJobs((prev) => [...new Set([...prev, selectedJob._id])]);
        toast.success("Application tracked in My Applications!");
      } catch (error) {
        console.error("Auto track external application notice:", error);
        setAppliedJobs((prev) => [...new Set([...prev, selectedJob._id])]);
      }
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
      setAppliedJobs((prev) => [...new Set([...prev, selectedJob._id])]);
      toast.success("Application tracked in My Applications!");
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
      setApplying(true);
      const formData = new FormData();
      formData.append("jobId", selectedJob?._id);
      formData.append("useProfileResume", "true");

      const response = await applyJob(formData);
      toast.success(response?.message || "Application submitted successfully");

      if (response?.user) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      setAppliedJobs((prev) => [...prev, selectedJob?._id]);
      resetApplyState();
    } catch (error) {
      console.error("Application Error:", error);
      toast.error(error?.response?.data?.message || "Application Failed");
      setResumeChoiceMode(false);
      setShowApplyPanel(true);
    } finally {
      setApplying(false);
    }
  };

  // Candidate declined: show the normal uploader for a different resume.
  const handleUseDifferentResume = () => {
    setUseSavedResume(false);
    setResumeChoiceMode(false);
    setShowApplyPanel(true);
  };

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
      
      setJobs((prev) => prev.filter((j) => j._id !== pendingFeedbackJob._id));
      setRecommendedJobsList((prev) => prev.filter((j) => j._id !== pendingFeedbackJob._id));
      
      if (selectedJob?._id === pendingFeedbackJob._id) {
        setSelectedJob(null);
        setIsMobileDetailView(false);
      }
    } catch {
      toast.error("Failed to hide job");
    }
    closeFeedbackModal();
  };

  const INDIAN_CITIES = [
    "india", "bangalore", "bengaluru", "mumbai", "delhi", "noida", "gurgaon", "gurugram", 
    "hyderabad", "chennai", "pune", "jaipur", "kolkata", "ahmedabad", "surat", "chandigarh", "kochi"
  ];

  const matchesLocationFilter = (jobLocation, filterTerm) => {
    if (!filterTerm || !filterTerm.trim()) return true;
    const term = filterTerm.trim().toLowerCase();
    const loc = (jobLocation || "").toLowerCase();

    if (term === "india") {
      return INDIAN_CITIES.some((city) => loc.includes(city));
    }
    return loc.includes(term);
  };

  const availableJobs = jobs
    .filter((job) => !appliedJobs.includes(job._id))
    .filter((job, idx, arr) => arr.findIndex((j) => j._id === job._id) === idx)
    .filter((job) => {
      // Location filter check for All Jobs
      if (locationFilter && !matchesLocationFilter(job.location, locationFilter)) {
        return false;
      }
      return true;
    });

  // Combine initial recommended jobs + live search result jobs for the Recommended tab
  const availableRecommended = [...recommendedJobsList, ...jobs]
    .filter((job) => !appliedJobs.includes(job._id))
    .filter((job, idx, arr) => arr.findIndex((j) => j._id === job._id) === idx);

  // Apply location, search, and experience filters to Recommended tab as well
  const filteredRecommended = availableRecommended.filter((job) => {
    // 1. Location Filter
    if (locationFilter && !matchesLocationFilter(job.location, locationFilter)) {
      return false;
    }

    // 2. Keyword Search
    if (search && search.trim()) {
      const sTerm = search.trim().toLowerCase();
      const titleLower = (job.title || "").toLowerCase();
      const companyLower = (job.company || "").toLowerCase();
      const descLower = (job.description || "").toLowerCase();
      const matchesSearch = titleLower.includes(sTerm) || companyLower.includes(sTerm) || descLower.includes(sTerm);
      if (!matchesSearch) return false;
    }

    // 3. Experience Level Filter
    if (experienceFilter && experienceFilter !== "All Experience") {
      if (job.experienceRequired && job.experienceRequired.toLowerCase() !== experienceFilter.toLowerCase()) {
        return false;
      }
    }

    // 4. Fresher/Junior Experience Guard
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
        return false;
      }
    }
    return true;
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

  // Fetch official messages from backend
  const fetchOfficialMessages = useCallback(async () => {
    setLoadingOfficialMessages(true);
    try {
      const res = await getMyMessages({ page: 1, limit: 50 });
      if (res?.success) {
        const msgs = res.messages || [];
        setOfficialMessages(msgs);
        const unread = typeof res.unreadCount === "number"
          ? res.unreadCount
          : msgs.filter((m) => !m.isRead).length;
        setUnreadOfficialCount(unread);
        if (msgs.length > 0) {
          setSelectedOfficialMessage((prev) => {
            if (prev) {
              return msgs.find((m) => m._id === prev._id) || msgs[0];
            }
            return msgs[0];
          });
        }
      }
    } catch (err) {
      console.warn("Failed fetching official communications:", err);
    } finally {
      setLoadingOfficialMessages(false);
    }
  }, []);

  // Listen to URL ?tab=messages or ?tab=alerts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "messages" || tabParam === "alerts") {
      window.dispatchEvent(new CustomEvent("skillbridge_open_messages"));
    }
  }, [location.search]);

  // Initial fetch and global event listeners for official messages
  useEffect(() => {
    fetchOfficialMessages();

    const handleSync = (e) => {
      if (typeof e.detail?.unreadCount === "number") {
        setUnreadOfficialCount(e.detail.unreadCount);
      } else {
        fetchOfficialMessages();
      }
    };

    window.addEventListener("skillbridge_official_messages_updated", handleSync);
    return () => {
      window.removeEventListener("skillbridge_official_messages_updated", handleSync);
    };
  }, [fetchOfficialMessages]);

  const handleSelectOfficialMessage = (msg) => {
    setSelectedOfficialMessage(msg);
    setIsMobileDetailView(true);
    if (!msg.isRead) {
      // Optimistic update
      setOfficialMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m))
      );
      setUnreadOfficialCount((prev) => {
        const next = Math.max(0, prev - 1);
        notifyMessagesUpdated(next);
        return next;
      });
      markMessageAsRead(msg._id).catch((err) => {
        console.error("Failed marking official message as read:", err);
      });
    }
  };

  const handleMarkAllOfficialRead = async () => {
    setOfficialMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    setUnreadOfficialCount(0);
    notifyMessagesUpdated(0);
    try {
      await markAllMessagesAsRead();
      toast.success("All messages marked as read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangleIcon size={11} />
            Urgent Action Required
          </span>
        );
      case "announcement":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <MegaphoneIcon size={11} />
            Platform Update
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-brand-700 border border-blue-200">
            <InfoIcon size={11} />
            Notice
          </span>
        );
    }
  };

  const filteredOfficialMessages = officialMessages.filter((m) => {
    if (officialFilter === "unread") return !m.isRead;
    return true;
  });

  const urgentOfficialMessage = officialMessages.find(
    (m) => !m.isRead && (m.priority === "urgent" || m.priority === "announcement")
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans pb-24">
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Candidate Dashboard</h1>
      {jobLoadError && (
        <div className="flex justify-end px-6 w-full mb-4">
          <RetryBanner message={jobLoadError} onRetry={retryFetchJobs} />
        </div>
      )}
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
        {/* MOBILE HEADER BLOCK */}
        <div className="block md:hidden mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase m-0">WELCOME BACK</p>
              <h2 className="text-xl font-black text-slate-900 m-0">{user?.name?.split(" ")[0] || "Candidate"}</h2>
            </div>
            {/* Circular Profile Completion Ring */}
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center p-0.5 cursor-pointer shadow-sm transition-transform active:scale-95" 
              onClick={() => navigate("/candidate-profile")}
              style={{ background: `conic-gradient(#2563eb ${profileCompletion}%, #e5e7eb 0)` }}
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-extrabold text-xs text-brand-600">
                {profileCompletion}%
              </div>
            </div>
          </div>
        </div>

        {/* TOP SUMMARY BANNER FOR URGENT / UNREAD OFFICIAL COMMUNICATIONS */}
        {unreadOfficialCount > 0 && showUrgentBanner && (
          <div className={`mb-5 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm ${
            urgentOfficialMessage?.priority === "announcement"
              ? "bg-purple-50 border-purple-200 text-purple-900"
              : urgentOfficialMessage?.priority === "urgent"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shrink-0 shadow-xs">
                {urgentOfficialMessage?.priority === "urgent" ? (
                  <AlertTriangleIcon size={18} className="text-rose-600" />
                ) : urgentOfficialMessage?.priority === "announcement" ? (
                  <MegaphoneIcon size={18} className="text-purple-600" />
                ) : (
                  <ShieldIcon size={18} className="text-blue-600" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold m-0 leading-tight">
                  {urgentOfficialMessage?.priority === "urgent"
                    ? `You have ${unreadOfficialCount} unread urgent notification${unreadOfficialCount > 1 ? "s" : ""} from administration`
                    : `You have ${unreadOfficialCount} unread official announcement${unreadOfficialCount > 1 ? "s" : ""}`}
                </h4>
                <p className="text-xs text-slate-600 m-0 mt-0.5">
                  {urgentOfficialMessage ? urgentOfficialMessage.title : "Check your official communications hub for critical platform updates."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("skillbridge_open_messages"));
                }}
              >
                <span>View Messages</span>
                <ChevronRightIcon size={14} />
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/60 transition-colors border-0 bg-transparent cursor-pointer"
                onClick={() => setShowUrgentBanner(false)}
                title="Dismiss alert banner"
                aria-label="Dismiss banner"
              >
                <CloseIcon size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SEARCH CONSOLE BAR */}
        <div className="mb-6">
            <div 
              className="flex flex-col md:flex-row items-stretch md:items-center bg-white border border-slate-300 rounded-2xl shadow-sm p-1.5 gap-1 hover:border-slate-400 transition-colors cursor-pointer md:cursor-default" 
              onClick={() => window.innerWidth <= 768 && setIsMobileSearchExpanded(true)}
            >
              <div className="flex-1 flex items-center px-3 py-2 gap-2.5 min-w-0">
                <FiSearch className="text-slate-400 text-lg shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  readOnly={window.innerWidth <= 768}
                  className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="hidden md:block w-px h-7 bg-slate-200 my-auto shrink-0" />
              <div className="hidden md:flex flex-1 items-center px-3 py-2 gap-2.5 min-w-0">
                <FiMapPin className="text-slate-400 text-lg shrink-0" />
                <input
                  type="text"
                  placeholder="India"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
              <div className="hidden md:block w-px h-7 bg-slate-200 my-auto shrink-0" />
              <div className="hidden md:flex w-52 items-center px-2">
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
                  className="w-full text-sm"
                />
              </div>

              <button 
                className="hidden md:block px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shrink-0 shadow-sm"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setIsMobileSearchExpanded(false)}>
            <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-slide-in-right" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 m-0">Search Filters</h3>
                <button className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center border-0 cursor-pointer" onClick={() => setIsMobileSearchExpanded(false)}>✕</button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                  <FiSearch className="text-slate-400 text-lg shrink-0" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-sm text-slate-900"
                  />
                </div>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl">
                  <FiMapPin className="text-slate-400 text-lg shrink-0" />
                  <input
                    type="text"
                    placeholder="City, state, zip code, or 'remote'"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-sm text-slate-900"
                  />
                </div>
                <div className="w-full">
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
                    className="w-full"
                  />
                </div>

                <button 
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-md mt-2"
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: LISTING CONTAINER */}
          <div className={`${isMobileDetailView ? "hidden lg:block" : "block"} lg:col-span-5 h-[calc(100vh-210px)] overflow-y-auto pr-0 lg:pr-2 pb-10 space-y-4`}>
            
            {/* SEGMENTED CONTROL ROW */}
            <div className="mb-4">
              <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-full border border-slate-200">
                {[
                  { id: "All Jobs", label: "All Jobs" },
                  { id: "Recommended", label: "Recommended" },
                  { id: "Saved", label: "Saved" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={`py-2 px-1 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-1 border-0 ${
                      activeTab === tab.id
                        ? "bg-brand-600 text-white shadow-xs"
                        : "bg-transparent text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileDetailView(false);
                    }}
                  >
                    <span className="truncate">{tab.label}</span>
                    {tab.badge > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        activeTab === tab.id ? "bg-white text-brand-600" : "bg-rose-500 text-white"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {loading ? (
              <div className="w-full space-y-3 py-2">
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : displayedJobs.length === 0 ? (
              <EmptyState
                illustration={workChatSvg}
                title={activeTab === "saved" ? "No saved jobs yet" : "No matching jobs found"}
                description={
                  activeTab === "saved"
                    ? "Bookmark jobs while browsing to review and apply to them later."
                    : "We couldn't find any opportunities matching your criteria. Try loosening search terms or clearing filters."
                }
                actionText={activeTab === "saved" ? "Browse All Jobs" : "Clear Filters"}
                onAction={
                  activeTab === "saved"
                    ? () => handleTabChange("all")
                    : () => {
                        setSearch("");
                        setLocationFilter("");
                        setRoleTypeFilter("");
                        setRemoteFilter(false);
                      }
                }
              />
            ) : (
              <>
                <div className="space-y-3">
                  {visibleJobs.map((job) => {
                    const isSelected = selectedJob?._id === job._id;
                    const hasApplied = appliedJobs.includes(job._id);
                    const matchInfo = calculateJobMatchScore(job, user);

                    return (
                      <div
                        key={job._id}
                        className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all ${
                          isSelected
                            ? "border-brand-500 ring-2 ring-brand-500/20 bg-blue-50/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                        }`}
                        onClick={() => handleJobSelect(job)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold text-slate-900 leading-snug tracking-tight mb-1 truncate">
                              {job.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
                              {job.companyLogo && (
                                <img 
                                  src={job.companyLogo} 
                                  alt={job.company} 
                                  className="w-4 h-4 object-contain rounded shrink-0"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <p className="truncate m-0">
                                {job.company} &bull; {job.location}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            className="p-2 -mr-1 -mt-1 text-slate-400 hover:text-brand-600 transition-colors border-0 bg-transparent cursor-pointer rounded-lg hover:bg-slate-50 shrink-0"
                            aria-label="Save job"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSave(job._id);
                            }}
                          >
                            {user?.savedJobs?.some((savedJobId) => savedJobId?.toString() === job?._id) ? (
                              <FaBookmark size={18} className="text-brand-600" />
                            ) : (
                              <FiBookmark size={18} className="text-slate-400 hover:text-brand-600" />
                            )}
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <StatusBadge
                            type="match"
                            score={matchInfo.score}
                            skillsCount={job.skills?.length || (Array.isArray(job.skillsRequired) ? job.skillsRequired.length : (job.skillsRequired ? 1 : 0))}
                          />

                          {job.skills && job.skills.length > 0 ? (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {job.skills[0]}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {job.isExternal ? "External" : "Internal"}
                            </span>
                          )}
                          
                          {job.isExternal && job.source && (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              via {capitalizeSource(job.source)}
                            </span>
                          )}
                          
                          {job.experience && job.experience !== "Fresher" ? (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                              {job.experience}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                              Entry Level
                            </span>
                          )}
                          
                          {hasApplied && <StatusBadge status="applied" size="sm" />}
                        </div>
                        
                        <div className="text-xs font-medium text-slate-400">
                          {getRelativeTime(job.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs mt-4">
                  <button
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600 disabled:active:scale-100 cursor-pointer shadow-xs border-0"
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
                  <span className="text-xs sm:text-sm font-semibold text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600 disabled:active:scale-100 cursor-pointer shadow-xs border-0"
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
          <div className={`${isMobileDetailView ? "fixed inset-0 z-[100] bg-white p-4 overflow-y-auto block" : "hidden"} lg:block lg:static lg:z-auto lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm h-[calc(100vh-210px)] overflow-hidden flex flex-col`}>
            {selectedJob ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header section */}
                <div className="p-6 border-b border-slate-200 bg-white">
                  <button 
                    className="block lg:hidden text-brand-600 font-bold text-sm mb-3 bg-transparent border-0 cursor-pointer p-0"
                    onClick={() => setIsMobileDetailView(false)}
                  >
                    &larr; Back to Jobs
                  </button>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-1">
                    {selectedJob.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedJob.companyLogo && (
                      <img 
                        src={selectedJob.companyLogo} 
                        alt={selectedJob.company} 
                        className="w-7 h-7 object-contain rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <p className="text-sm font-semibold text-slate-700 m-0">{selectedJob.company}</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{selectedJob.location}</p>
                  <p className="text-base font-bold text-slate-900 mb-3">
                    {formatSalary(selectedJob.salary, selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryCurrency)}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {(() => {
                      const matchInfo = calculateJobMatchScore(selectedJob, user);
                      return (
                        <>
                          <StatusBadge
                            type="match"
                            score={matchInfo.score}
                            skillsCount={selectedJob.skills?.length || (Array.isArray(selectedJob.skillsRequired) ? selectedJob.skillsRequired.length : (selectedJob.skillsRequired ? 1 : 0))}
                            size="md"
                          />
                          {matchInfo.matchedSkills.length > 0 && (
                            <div className="w-full flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-slate-600">Matched Skills:</span>
                              {matchInfo.matchedSkills.map((sk) => (
                                <span key={sk} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-brand-700 border border-blue-200">
                                  ✓ {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      💼 <span>{selectedJob.employmentType || selectedJob.role || "Full-time"}</span>
                    </span>
                    {selectedJob.isExternal && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        External
                      </span>
                    )}
                    {selectedJob.isExternal && selectedJob.source && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        via {capitalizeSource(selectedJob.source)}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">
                      {getRelativeTime(selectedJob.createdAt)}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2">
                    {selectedJob.expiresAt && new Date(selectedJob.expiresAt) < new Date() ? (
                      <button className="px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-100 text-rose-800 border border-rose-200 cursor-not-allowed" disabled>
                        This job is no longer available
                      </button>
                    ) : appliedJobs?.includes(selectedJob._id) ? (
                      <button className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" disabled>
                        Applied Already
                      </button>
                    ) : resumeChoiceMode ? (
                      <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl w-full">
                        <p className="text-sm font-bold text-slate-800 mb-3">
                          Use your saved resume for this application?
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50 border-0"
                            onClick={handleUseSavedResume}
                            disabled={fetchingSavedResume}
                          >
                            {fetchingSavedResume ? "Loading..." : "Yes, use saved resume"}
                          </button>
                          <button
                            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50"
                            onClick={handleUseDifferentResume}
                            disabled={fetchingSavedResume}
                          >
                            No, upload different
                          </button>
                        </div>
                      </div>
                    ) : showApplyPanel ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 bg-slate-50 border-2 border-dashed border-brand-500 rounded-2xl w-full">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setResumeFile(e.target.files[0])}
                          className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 flex-1"
                        />
                        <div className="flex items-center gap-2">
                          <button 
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all disabled:opacity-50 border-0" 
                            onClick={() => submitApplication()}
                            disabled={applying}
                          >
                            {applying ? "Sending..." : "Submit Application"}
                          </button>
                          <button 
                            className="p-2 text-slate-400 hover:text-rose-600 bg-transparent border-0 cursor-pointer font-bold"
                            onClick={resetApplyState}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {!externalApplyActive ? (
                          <button 
                            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0"
                            onClick={handleApplyNowClick}
                          >
                            Apply Now
                          </button>
                        ) : (
                          <>
                            <button 
                              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0"
                              onClick={handleManualTrack}
                            >
                              Mark as Applied
                            </button>
                            <button 
                              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm rounded-xl cursor-pointer transition-all border border-slate-300"
                              onClick={handleApplyNowClick}
                            >
                              Open Again
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                            user?.savedJobs?.some(
                              (savedJobId) => savedJobId?.toString() === selectedJob?._id
                            )
                              ? "bg-rose-50 border-rose-200 text-rose-600"
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                          onClick={() => handleToggleSave(selectedJob._id)}
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

                {/* Scroll body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  {/* Qualifications match box */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Your qualifications for this job</h4>
                    
                    <div className="space-y-2.5">
                      {selectedJob.educationRequired && (
                        <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-normal">
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                          <span>{selectedJob.educationRequired}</span>
                        </div>
                      )}
                      
                      {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 ? (
                         selectedJob.skillsRequired.map((skill, idx) => {
                            const isMatch = user?.skills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                            return (
                                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-normal">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                    isMatch ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                  }`}>
                                    {isMatch ? "✓" : "○"}
                                  </span>
                                  <span>{skill}</span>
                                </div>
                            );
                         })
                      ) : (
                         <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-normal">
                           <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                           <span>{selectedJob.experienceRequired || "Entry Level"}</span>
                         </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Full Job Description</h4>
                    
                    <div className={`relative overflow-hidden transition-all duration-300 ${isDescriptionExpanded ? "max-h-none" : "max-h-96"}`}>
                      <div className="text-sm text-slate-700 leading-relaxed space-y-3 prose prose-slate max-w-none">
                        {selectedJob.isExternal ? (
                          renderExternalDescription(selectedJob.description)
                        ) : (
                          <div>
                            {selectedJob.description.split('\n').map((p, i) => (
                              <p key={i} className="mb-2">{p}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      {!isDescriptionExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      )}
                    </div>

                    <button 
                      className="mt-3 text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? "Show less ∧" : "Show more ∨"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center text-sm">
                <p>Select a job listing entry to view comprehensive insights here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ONE-TIME PROFILE COMPLETION NUDGE MODAL */}
      {showProfileNudge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowProfileNudge(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-7 text-center relative shadow-2xl border border-slate-100 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center border-0 cursor-pointer transition-colors"
              onClick={() => setShowProfileNudge(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <span className="text-4xl mb-3 block">📋</span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Complete your profile to get matched</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              Your profile is only <strong className="text-slate-900">{profileCompletion}% complete</strong>.
              Add a few more details &mdash; like your skills and resume &mdash; so we can
              recommend jobs that actually fit you.
            </p>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0"
                onClick={() => navigate("/candidate-profile")}
              >
                Complete my profile
              </button>
              <button
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent border-0 cursor-pointer transition-colors"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={closeFeedbackModal}>
          <div className="w-full max-w-md bg-white rounded-3xl p-7 text-center relative shadow-2xl border border-slate-100 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <span className="text-4xl mb-3 block">👋</span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Welcome back!</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Did you apply for the <strong className="text-slate-900">{pendingFeedbackJob.title}</strong> role at {pendingFeedbackJob.company}?
            </p>

            <div className="flex flex-col gap-2.5">
              <button 
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0" 
                onClick={handleFeedbackYes}
              >
                Yes, I applied
              </button>
              <button 
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors border-0" 
                onClick={handleFeedbackNo}
              >
                No, I didn't apply
              </button>
              <button 
                className="w-full py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-transparent hover:bg-rose-50 rounded-xl cursor-pointer transition-colors border-0"
                onClick={handleFeedbackHide}
              >
                Not a fit / Hide this job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONBOARDING WIZARD MODAL FOR NEW CANDIDATES */}
      {user && user.role === "candidate" && !user.hasCompletedOnboarding && (
        <OnboardingWizard
          user={user}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
}

export default CandidateDashboard;


