import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createJob, getRecruiterJobs, deleteJob, updateJob, getRecruiterApplications, generateJobDescriptionAPI, getUserProfile } from "../../Services/jobService";
import { RECRUITER_REMINDER_START_KEY } from "../../Services/authUtils";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import CustomSelect from "../../Components/CustomSelect";
import RecruiterOnboardingModal from "../../Components/RecruiterOnboardingModal";
import EmptyState from "../../Components/common/EmptyState";
import { JobCardSkeleton, MetricCardSkeleton } from "../../Components/common/SkeletonLoader";
import undrawCareerSvg from "../../assets/undraw_career-progress_vfq5.svg";

import {
  HiOutlineBriefcase,
  HiChevronDown,
  HiOutlinePlus,
  HiOutlineMapPin,
  HiOutlineSquares2X2,
  HiOutlineListBullet,
  HiXMark,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
const ROLE_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const EXPERIENCE_LEVELS = ["Entry-level / Fresher", "Mid-level", "Senior", "Lead"];
const CITY_SUGGESTIONS = [
  "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Amritsar", "Amsterdam", "Atlanta", "Aurangabad",
  "Bengaluru", "Berlin", "Bhopal", "Bhubaneswar", "Boston", "Chandigarh", "Chennai", "Chicago",
  "Coimbatore", "Dehradun", "Delhi", "Dubai", "Faridabad", "Ghaziabad", "Goa", "Gurugram",
  "Guwahati", "Hyderabad", "Indore", "Jaipur", "Jodhpur", "Kanpur", "Kochi", "Kolkata",
  "Lucknow", "London", "Los Angeles", "Ludhiana", "Madurai", "Mangaluru", "Meerut", "Mumbai",
  "Mysuru", "Nagpur", "Nashik", "New York", "Noida", "Patna", "Pune", "Rajkot", "Ranchi",
  "San Francisco", "Seattle", "Singapore", "Surat", "Thane", "Toronto", "Vadodara", "Varanasi",
  "Vijayawada", "Visakhapatnam",
];
const COUNTRY_SUGGESTIONS = ["Australia", "Canada", "France", "Germany", "India", "Japan", "Netherlands", "Singapore", "United Arab Emirates", "United Kingdom", "United States"];
const splitJobLocation = (location = "") => {
  const parts = String(location).split(",").map((part) => part.trim()).filter(Boolean);
  const lastPart = parts.at(-1);
  const country = COUNTRY_SUGGESTIONS.find((name) => name.toLowerCase() === lastPart?.toLowerCase()) || "";
  return country ? { city: parts.slice(0, -1).join(", "), country } : { city: parts.join(", "), country: "" };
};
const initialFormState = {
  title: "", workplaceType: "", city: "", country: "", location: "", employmentType: "Full-time",
  experienceRequired: "", minSalary: "", maxSalary: "", showSalaryRange: true,
  skillsRequired: [], company: "", description: "",
};
const JOBS_PER_PAGE = 6;

function RecruiterDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      return null;
    }
  });
  const [showRecruiterOnboarding, setShowRecruiterOnboarding] = useState(() =>
    user?.role === "recruiter" && !user?.isOnboarded && !user?.recruiterOnboardingPromptDismissed
  );
  const [showOnboardingReminder, setShowOnboardingReminder] = useState(() => {
    const shouldShow = user?.role === "recruiter" && !user?.isOnboarded && Boolean(user?.recruiterOnboardingPromptDismissed);
    if (!shouldShow) return false;
    try {
      const start = sessionStorage.getItem(RECRUITER_REMINDER_START_KEY);
      if (start) {
        return Date.now() - parseInt(start, 10) < 30000;
      }
      sessionStorage.setItem(RECRUITER_REMINDER_START_KEY, String(Date.now()));
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (user?.role !== "recruiter" || user?.isOnboarded) return;
    try {
      if (!sessionStorage.getItem(RECRUITER_REMINDER_START_KEY)) {
        sessionStorage.setItem(RECRUITER_REMINDER_START_KEY, String(Date.now()));
      }
    } catch {
      // The banner still has its in-memory timeout if session storage is unavailable.
    }
  }, [user?.role, user?.isOnboarded]);

  // Automatically remove onboarding reminder banner 30 seconds after login
  useEffect(() => {
    if (!showOnboardingReminder) return;

    let remainingTime = 30000;
    try {
      let start = sessionStorage.getItem(RECRUITER_REMINDER_START_KEY);
      if (!start) {
        start = String(Date.now());
        sessionStorage.setItem(RECRUITER_REMINDER_START_KEY, start);
      }
      const elapsed = Date.now() - parseInt(start, 10);
      remainingTime = Math.max(0, 30000 - elapsed);
    } catch {
      remainingTime = 30000;
    }

    if (remainingTime <= 0) {
      setShowOnboardingReminder(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowOnboardingReminder(false);
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [showOnboardingReminder]);

  const [formData, setFormData] = useState(initialFormState);
  const [skillInput, setSkillInput] = useState("");
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [countrySuggestionsOpen, setCountrySuggestionsOpen] = useState(false);
  const descriptionRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, shortlisted: 0, rejected: 0 });

  // Modal visibility for Create/Edit Job card
  const [showJobModal, setShowJobModal] = useState(false);
  useEffect(() => {
    if (!showJobModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setShowJobModal(false);
        setEditingJob(null);
        setFormData({ ...initialFormState, company: user?.companyName || "" });
        setSkillInput("");
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showJobModal, user?.companyName]);

  // Filter: derived dynamically from real job data (no static dropdown options)
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // View mode: grid or list — both render the same real job data
  const [viewMode, setViewMode] = useState("grid");

  // Pagination
  const [visibleCount, setVisibleCount] = useState(JOBS_PER_PAGE);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await getRecruiterJobs();
      setJobs(response?.jobs || []);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([getRecruiterApplications(), getRecruiterJobs()]);
      const apps = appRes?.applications || [];
      setStats({
        totalJobs: (jobRes?.jobs || []).length,
        totalApplications: apps.length,
        shortlisted: apps.filter((a) => a.status === "shortlisted").length,
        rejected: apps.filter((a) => a.status === "rejected").length,
      });
    } catch (error) {
      console.error("Stats Error:", error);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    await Promise.all([fetchJobs(), fetchStats()]);
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    let active = true;
    getUserProfile().then(({ user: profile }) => {
      if (!active || !profile) return;
      setUser(profile);
      setFormData((current) => current.company || !profile.companyName ? current : { ...current, company: profile.companyName });
      setShowRecruiterOnboarding(profile.role === "recruiter" && !profile.isOnboarded && !profile.recruiterOnboardingPromptDismissed);
      const shouldShowReminder = profile.role === "recruiter" && !profile.isOnboarded && Boolean(profile.recruiterOnboardingPromptDismissed);
      if (shouldShowReminder) {
        try {
          const start = sessionStorage.getItem(RECRUITER_REMINDER_START_KEY);
          if (start && Date.now() - parseInt(start, 10) >= 30000) {
            setShowOnboardingReminder(false);
          } else {
            if (!start) sessionStorage.setItem(RECRUITER_REMINDER_START_KEY, String(Date.now()));
            setShowOnboardingReminder(true);
          }
        } catch {
          setShowOnboardingReminder(true);
        }
      } else {
        setShowOnboardingReminder(false);
      }
      localStorage.setItem("user", JSON.stringify(profile));
    }).catch((error) => console.error("Could not load recruiter profile:", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (location.pathname === "/jobs/create") setShowJobModal(true);
  }, [location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "workplaceType") {
      setFormData((prev) => ({
        ...prev,
        workplaceType: value,
        city: value === "Remote" || prev.location === "Remote" ? "" : prev.city,
        country: value === "Remote" || prev.location === "Remote" ? "" : prev.country,
        location: value === "Remote" ? "Remote" : prev.location === "Remote" ? "" : prev.location,
      }));
      return;
    }
    if (name === "city" || name === "country") {
      setFormData((prev) => {
        const city = name === "city" ? value : prev.city;
        const country = name === "country" ? value : prev.country;
        return { ...prev, [name]: value, location: [city, country].filter(Boolean).join(", ") };
      });
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Opens the Create Job card as a modal overlay
  const handleQuickCreate = () => {
    setEditingJob(null);
    setFormData({ ...initialFormState, company: user?.companyName || "" });
    setSkillInput("");
    setShowJobModal(true);
  };

  const closeJobModal = () => {
    setShowJobModal(false);
    setEditingJob(null);
    setFormData({ ...initialFormState, company: user?.companyName || "" });
    setSkillInput("");
  };


  const generateAIDescription = async () => {
    if (!formData.title || !formData.company) {
      toast.error('Please enter a Job Title and Company first!');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const response = await generateJobDescriptionAPI({
        title: formData.title,
        company: formData.company,
        role: formData.employmentType,
      });
      setFormData(prev => ({ ...prev, description: response.description }));
      toast.success('AI Description Generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to generate description with AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.title.trim().length < 3) return toast.error("Job title must be at least 3 characters");
    if (!formData.workplaceType) return toast.error("Select a workplace type");
    if (formData.workplaceType !== "Remote" && !formData.city.trim()) return toast.error("Enter a city");
    if (formData.workplaceType !== "Remote" && !formData.country.trim()) return toast.error("Enter a country");
    if (!formData.experienceRequired) return toast.error("Select an experience level");
    if (formData.description.trim().length < 10) return toast.error("Job description must be at least 10 characters");
    const minSalary = formData.minSalary === "" ? null : Number(formData.minSalary);
    const maxSalary = formData.maxSalary === "" ? null : Number(formData.maxSalary);
    if ((minSalary !== null && (!Number.isFinite(minSalary) || minSalary < 0)) || (maxSalary !== null && (!Number.isFinite(maxSalary) || maxSalary < 0))) {
      return toast.error("Salary must be a valid non-negative number");
    }
    if (minSalary !== null && maxSalary !== null && maxSalary < minSalary) return toast.error("Maximum salary must be greater than or equal to minimum salary");
    if (!formData.company.trim()) return toast.error("Add your company name in your recruiter profile first");

    const payload = {
      ...formData,
      title: formData.title.trim(),
      company: user?.companyName || formData.company,
      location: formData.workplaceType === "Remote" ? "Remote" : [formData.city.trim(), formData.country.trim()].join(", "),
      salary: formData.showSalaryRange && (minSalary !== null || maxSalary !== null)
        ? (minSalary !== null && maxSalary !== null ? `${minSalary} - ${maxSalary}` : String(minSalary ?? maxSalary))
        : "Competitive",
      salaryCurrency: "INR",
      minSalary,
      maxSalary,
      description: formData.description.trim(),
    };
    if (formData.workplaceType !== "Remote" && !payload.location) return toast.error("Location is required for on-site or hybrid roles");

    try {
      setSubmitting(true);
      let response = editingJob ? await updateJob(editingJob._id, payload) : await createJob(payload);
      toast.success(response?.message || (editingJob ? "Job updated successfully" : "Job created successfully"));
      setFormData(initialFormState);
      setSkillInput("");
      setEditingJob(null);
      setShowJobModal(false);
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const addSkill = (value = skillInput) => {
    const skill = value.trim().replace(/,$/, "");
    if (!skill) return;
    if (formData.skillsRequired.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setFormData((current) => ({ ...current, skillsRequired: [...current.skillsRequired, skill] }));
    setSkillInput("");
  };

  const removeSkill = (skill) => setFormData((current) => ({
    ...current,
    skillsRequired: current.skillsRequired.filter((item) => item !== skill),
  }));

  const cityQuery = formData.city.trim();
  const matchingCities = cityQuery.length >= 2
    ? CITY_SUGGESTIONS.filter((city) => city.toLowerCase().includes(cityQuery.toLowerCase())).slice(0, 6)
    : [];
  const locationSuggestions = matchingCities.length ? matchingCities : cityQuery.length >= 2 ? [cityQuery] : [];
  const isCustomCitySuggestion = matchingCities.length === 0 && locationSuggestions.length > 0;
  const countryQuery = formData.country.trim();
  const matchingCountries = countryQuery.length >= 1
    ? COUNTRY_SUGGESTIONS.filter((country) => country.toLowerCase().includes(countryQuery.toLowerCase())).slice(0, 6)
    : COUNTRY_SUGGESTIONS.slice(0, 6);
  const countrySuggestions = matchingCountries.length ? matchingCountries : countryQuery ? [countryQuery] : [];
  const isCustomCountrySuggestion = matchingCountries.length === 0 && countrySuggestions.length > 0;

  const insertDescriptionMarkup = (before, after = "", asList = false) => {
    const input = descriptionRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = formData.description.slice(start, end);
    const placeholder = asList ? "Required qualification" : "text";
    const replacement = asList
      ? (selected ? selected.split("\n").map((line) => `- ${line}`).join("\n") : `- ${placeholder}`)
      : `${before}${selected || placeholder}${after}`;
    const next = `${formData.description.slice(0, start)}${replacement}${formData.description.slice(end)}`;
    setFormData((current) => ({ ...current, description: next }));
    requestAnimationFrame(() => {
      input.focus();
      const caret = start + (asList ? replacement.length : before.length + (selected ? selected.length : placeholder.length));
      input.setSelectionRange(caret, caret);
    });
  };



  const handleDelete = async (jobId) => {
    try {
      const response = await deleteJob(jobId);
      toast.success(response?.message || "Job deleted");
      await fetchDashboardData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title || "",
      workplaceType: job.workplaceType || (job.isRemote ? "Remote" : "On-site"),
      employmentType: ROLE_TYPES.includes(job.employmentType) ? job.employmentType : "Full-time",
      experienceRequired: EXPERIENCE_LEVELS.includes(job.experienceRequired) ? job.experienceRequired : "Entry-level / Fresher",
      minSalary: job.salaryMin ?? "",
      maxSalary: job.salaryMax ?? "",
      showSalaryRange: job.showSalaryRange !== false,
      skillsRequired: Array.isArray(job.skillsRequired) ? job.skillsRequired : [],
      company: user?.companyName || job.company || "",
      ...((job.isRemote || job.workplaceType === "Remote") ? { city: "", country: "", location: "Remote" } : { ...splitJobLocation(job.location), location: job.location || "" }),
      salary: job.salary || "",
      description: job.description || "",
    });
    setSkillInput("");
    setShowJobModal(true);
  };

  // Build the status filter's option list dynamically from the actual jobs returned —
  // no hardcoded "Active / Draft" options that don't map to real data.
  const availableRoleTypes = useMemo(() => {
    const types = new Set(jobs.map((job) => job.role).filter(Boolean));
    return ["All", ...Array.from(types)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "All") return jobs;
    return jobs.filter((job) => job.role === statusFilter);
  }, [jobs, statusFilter]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);
  const hasMoreJobs = visibleCount < filteredJobs.length;

  // Reset pagination whenever the filter changes so results start from the top
  useEffect(() => {
    setVisibleCount(JOBS_PER_PAGE);
  }, [statusFilter]);

  // Close the custom filter dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectFilter = (type) => {
    setStatusFilter(type);
    setIsFilterOpen(false);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + JOBS_PER_PAGE);
  };

  return (
    <div className="app-canvas-surface recruiter-dashboard-page w-full min-h-screen font-sans pb-20 text-slate-900">
      <div aria-hidden="true" className="recruiter-dashboard-orb recruiter-dashboard-orb-top" />
      <div aria-hidden="true" className="recruiter-dashboard-orb recruiter-dashboard-orb-bottom" />
      <main className="recruiter-dashboard-main max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {showOnboardingReminder && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#ead5b7] bg-[#fff7e9] p-4 sm:flex-row sm:items-center sm:justify-between transition-all duration-300">
            <div>
              <p className="m-0 text-sm font-bold text-[#493b2e]">Finish setting up your company profile</p>
              <p className="mb-0 mt-1 text-xs text-[#746555]">Add your website and company details so candidates can learn about your team.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/recruiter-profile")}
                className="rounded-xl border border-[#d9c4a8] bg-white px-4 py-2 text-xs font-bold text-[#8f4a24] hover:bg-[#fffaf2] transition-colors"
              >
                Complete profile
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem(RECRUITER_REMINDER_START_KEY, "0");
                  } catch {
                    // ignore
                  }
                  setShowOnboardingReminder(false);
                }}
                aria-label="Dismiss banner"
                title="Dismiss"
                className="rounded-xl border border-transparent p-1.5 text-[#8f4a24] hover:bg-[#faebd7] hover:border-[#ead5b7] transition-all cursor-pointer"
              >
                <HiXMark size={16} />
              </button>
            </div>
          </div>
        )}

        {/* SUB-HEADER CONTEXT ROW (Mobile only) */}
        <div className="recruiter-welcome-card block md:hidden p-5 rounded-2xl border">
          <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">RECRUITER DECK</p>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 m-0 truncate">{user?.company || "Your Company"}</h2>
            <button 
              className="recruiter-primary-button px-4 py-2 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border-0 shrink-0"
              onClick={handleQuickCreate}
            >
              <HiOutlinePlus size={16} /> Post Job
            </button>
          </div>
        </div>

        {/* TOPBAR (Desktop) */}
        <section className="hidden md:flex items-center justify-between recruiter-welcome-card p-5 sm:p-6 rounded-2xl border">
          <div>
            <h2 className="recruiter-welcome-title m-0">Welcome back, <span>Recruiter</span></h2>
            <p className="text-sm font-medium text-slate-600 mt-1 m-0">Manage your jobs and find the best talent</p>
          </div>
          <div>
            <button 
              type="button" 
              className="recruiter-primary-button px-5 py-2.5 text-white font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center gap-2 border-0"
              onClick={handleQuickCreate}
            >
              <HiOutlinePlus size={18} /> Create Job
            </button>
          </div>
        </section>

        {/* SCORECARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <div className="recruiter-metric-card flex items-center gap-3">
                <div className="recruiter-metric-icon metric-jobs flex items-center justify-center shrink-0">
                  <HiOutlineBriefcase />
                </div>
                <div>
                  <h3 className="recruiter-metric-value m-0">{stats.totalJobs}</h3>
                  <p className="recruiter-metric-label m-0">Total Jobs</p>
                </div>
              </div>
              <div className="recruiter-metric-card flex items-center gap-3">
                <div className="recruiter-metric-icon metric-applications flex items-center justify-center shrink-0">
                  <HiOutlineUserGroup />
                </div>
                <div>
                  <h3 className="recruiter-metric-value m-0">{stats.totalApplications}</h3>
                  <p className="recruiter-metric-label m-0">Applications</p>
                </div>
              </div>
              <div className="recruiter-metric-card flex items-center gap-3">
                <div className="recruiter-metric-icon metric-shortlisted flex items-center justify-center shrink-0">
                  <HiOutlineCheckCircle />
                </div>
                <div>
                  <h3 className="recruiter-metric-value m-0">{stats.shortlisted}</h3>
                  <p className="recruiter-metric-label m-0">Shortlisted</p>
                </div>
              </div>
              <div className="recruiter-metric-card flex items-center gap-3">
                <div className="recruiter-metric-icon metric-rejected flex items-center justify-center shrink-0">
                  <HiOutlineXCircle />
                </div>
                <div>
                  <h3 className="recruiter-metric-value m-0">{stats.rejected}</h3>
                  <p className="recruiter-metric-label m-0">Rejected</p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* JOBS LISTING */}
        <section className="recruiter-jobs-panel rounded-2xl border p-5 sm:p-6">
          <div className="recruiter-jobs-heading flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h3 className="m-0">My Posted Jobs</h3>
            <div className="flex flex-wrap items-center gap-3">
              {/* Desktop Filter Dropdown */}
              <div className="relative hidden md:block" ref={filterRef}>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer transition-colors"
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                >
                  <HiOutlineBriefcase className="text-slate-500" />
                  <span>{statusFilter}</span>
                  <HiChevronDown className={`transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-fade-in">
                    {availableRoleTypes.map((type) => (
                      <button
                        type="button"
                        key={type}
                        className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer border-0 ${
                          statusFilter === type ? "bg-brand-50 text-brand-700" : "bg-transparent text-slate-700 hover:bg-slate-50"
                        }`}
                        onClick={() => handleSelectFilter(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Scrollable Chips */}
              <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {availableRoleTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-0 cursor-pointer ${
                      statusFilter === type
                        ? "bg-brand-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    onClick={() => handleSelectFilter(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* View Toggle Buttons */}
              <div className="hidden md:inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer border-0 ${
                    viewMode === "grid" ? "bg-white text-brand-600 shadow-xs font-bold" : "bg-transparent text-slate-500 hover:text-slate-900"
                  }`}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <HiOutlineSquares2X2 size={18} />
                </button>
                <button
                  type="button"
                  className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer border-0 ${
                    viewMode === "list" ? "bg-white text-brand-600 shadow-xs font-bold" : "bg-transparent text-slate-500 hover:text-slate-900"
                  }`}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <HiOutlineListBullet size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className={`recruiter-job-list ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" : "flex flex-col gap-3.5"}`}>
            {loading ? (
              <div className="w-full col-span-full space-y-4 py-4" role="status" aria-label="Loading job opportunities">
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="w-full col-span-full py-8">
                <EmptyState
                  illustration={undrawCareerSvg}
                  title={jobs.length === 0 ? "No posted jobs yet" : "No jobs match this filter"}
                  description={
                    jobs.length === 0
                      ? "Post your first role to start receiving matched candidate applications."
                      : "Try choosing another role filter or reset to view all listings."
                  }
                  actionText={jobs.length === 0 ? "Post a Job" : "Clear Filter"}
                  onAction={jobs.length === 0 ? handleQuickCreate : () => setStatusFilter("All")}
                  className="recruiter-empty-state"
                />
              </div>
            ) : (
              visibleJobs.map((job) => (
                <article key={job._id} className="recruiter-job-card border rounded-2xl p-5 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        job.isActive !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {job.isActive !== false ? "Active" : "Closed"}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-1 mb-1">{job.title}</h4>
                    <p className="text-xs font-semibold text-slate-500 m-0">{job.company}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 my-2.5">
                      <div className="flex items-center gap-1">
                        <HiOutlineMapPin className="text-slate-400" />
                        <span>{job.location || "Remote, India"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HiOutlineUserGroup className="text-slate-400" />
                        <span>Applicants</span>
                      </div>
                    </div>

                    <div className="text-sm font-extrabold text-slate-900 mb-4">
                      {typeof job.salary === 'string' && isNaN(Number(job.salary)) ? job.salary : `₹${Number(job.salary).toLocaleString("en-IN")}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border-0" 
                      onClick={() => handleEdit(job)}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="py-2 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border-0" 
                      onClick={() => handleDelete(job._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {!loading && hasMoreJobs && (
            <div className="flex justify-center pt-4">
              <button 
                type="button" 
                className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer" 
                onClick={handleLoadMore}
              >
                <span>Load more jobs</span>
                <HiChevronDown />
              </button>
            </div>
          )}
        </section>
      </main>

      {showRecruiterOnboarding && (
        <RecruiterOnboardingModal
          user={user}
          onComplete={(profile) => {
            setUser((current) => ({ ...current, ...profile }));
            setShowRecruiterOnboarding(false);
            setShowOnboardingReminder(false);
          }}
          onSkip={(profile) => {
            setUser((current) => ({ ...current, ...profile }));
            setShowRecruiterOnboarding(false);
            setShowOnboardingReminder(true);
          }}
        />
      )}

      {/* MOBILE FLOATING ACTION BUTTON */}
      <button 
        className="md:hidden fixed bottom-6 right-6 z-40 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm px-5 py-3 rounded-full shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer border-0" 
        onClick={handleQuickCreate}
      >
        <HiOutlinePlus size={20} /> Post a new job
      </button>

      {/* CREATE / EDIT JOB MODAL */}
      {showJobModal && (
        createPortal(
        <div className="fixed inset-0 z-[2000] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-slate-900/60 p-3 backdrop-blur-md animate-fade-in sm:p-5" onClick={closeJobModal}>
          <div role="dialog" aria-modal="true" aria-labelledby="create-job-title" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-3xl border border-[#eadcc7] bg-[#fffdfa] p-6 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-h-[calc(100dvh-2.5rem)] sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#eadcc7]">
              <div>
                <h3 id="create-job-title" className="text-xl font-black text-[#493b2e] m-0">
                  {editingJob ? "Edit " : "Create "}
                  <span className="text-[#b96534]">{editingJob ? "Job" : "New Job"}</span>
                </h3>
                <p className="text-xs text-[#857565] mt-1 m-0">
                  {editingJob ? "Update the details for this job listing" : "Fill in the details to post a new job"}
                </p>
              </div>
              <button 
                type="button" 
                className="w-8 h-8 rounded-full bg-[#f6ead8] hover:bg-[#efdfc7] text-[#806a53] flex items-center justify-center cursor-pointer border-0"
                onClick={closeJobModal} 
                aria-label="Close"
              >
                <HiXMark size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Job title <span className="text-[#b96534]">*</span></span>
                <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Frontend Developer" required minLength={3} className="w-full rounded-xl border border-[#ead5b7] bg-[#fffaf2] px-3.5 py-2.5 text-sm text-[#493b2e] placeholder:text-[#9b8067] outline-none transition-all focus:border-[#c26d3b] focus:bg-[#fffdfa] focus:ring-2 focus:ring-[#c26d3b]/20" />
              </label>

              <fieldset>
                <legend className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Workplace type <span className="text-[#b96534]">*</span></legend>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#f6ead8] p-1">
                  {["On-site", "Hybrid", "Remote"].map((type) => (
                    <button key={type} type="button" aria-pressed={formData.workplaceType === type} onClick={() => handleChange({ target: { name: "workplaceType", value: type } })} className={`rounded-lg border-0 px-3 py-2 text-sm font-semibold transition-colors ${formData.workplaceType === type ? "bg-[#fffdfa] text-[#8f4a24] shadow-sm" : "bg-transparent text-[#746555] hover:bg-[#fffdfa]/70"}`}>{type}</button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Location {formData.workplaceType !== "Remote" && <span className="text-[#b96534]">*</span>}</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="order-2 block min-w-0">
                    <span className="mb-1 block text-xs font-semibold text-[#746555]">City</span>
                    <div className="relative">
                      <HiOutlineMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a58a6e]" />
                      <input name="city" value={formData.city} onChange={(event) => { handleChange(event); setLocationSuggestionsOpen(true); }} onFocus={() => setLocationSuggestionsOpen(true)} onBlur={() => setTimeout(() => setLocationSuggestionsOpen(false), 120)} placeholder="e.g. Jaipur" required={formData.workplaceType !== "Remote"} disabled={formData.workplaceType === "Remote"} autoComplete="off" aria-autocomplete="list" aria-expanded={locationSuggestionsOpen && locationSuggestions.length > 0} className="w-full rounded-xl border border-[#ead5b7] bg-[#fffaf2] py-2.5 pl-10 pr-3.5 text-sm text-[#493b2e] placeholder:text-[#9b8067] outline-none transition-all focus:border-[#c26d3b] focus:bg-[#fffdfa] focus:ring-2 focus:ring-[#c26d3b]/20 disabled:cursor-not-allowed disabled:bg-[#f6ead8] disabled:text-[#857565]" />
                      {locationSuggestionsOpen && locationSuggestions.length > 0 && formData.workplaceType !== "Remote" && (
                        <ul role="listbox" aria-label="Suggested cities" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#ead5b7] bg-[#fffdfa] p-1.5 shadow-lg">
                          {locationSuggestions.map((city) => (
                            <li key={city} role="option" aria-selected={formData.city === city}>
                              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { handleChange({ target: { name: "city", value: city } }); setLocationSuggestionsOpen(false); }} className="w-full rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm text-[#493b2e] hover:bg-[#f6ead8]">{isCustomCitySuggestion ? `Use “${city}”` : city}</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                  <label className="order-1 block min-w-0">
                    <span className="mb-1 block text-xs font-semibold text-[#746555]">Country</span>
                    <div className="relative">
                      <input name="country" value={formData.country} onChange={(event) => { handleChange(event); setCountrySuggestionsOpen(true); }} onFocus={() => setCountrySuggestionsOpen(true)} onBlur={() => setTimeout(() => setCountrySuggestionsOpen(false), 120)} placeholder="e.g. India" required={formData.workplaceType !== "Remote"} disabled={formData.workplaceType === "Remote"} autoComplete="off" aria-autocomplete="list" aria-expanded={countrySuggestionsOpen && countrySuggestions.length > 0} className="w-full rounded-xl border border-[#ead5b7] bg-[#fffaf2] px-3.5 py-2.5 text-sm text-[#493b2e] placeholder:text-[#9b8067] outline-none transition-all focus:border-[#c26d3b] focus:bg-[#fffdfa] focus:ring-2 focus:ring-[#c26d3b]/20 disabled:cursor-not-allowed disabled:bg-[#f6ead8] disabled:text-[#857565]" />
                      {countrySuggestionsOpen && countrySuggestions.length > 0 && formData.workplaceType !== "Remote" && (
                        <ul role="listbox" aria-label="Suggested countries" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#ead5b7] bg-[#fffdfa] p-1.5 shadow-lg">
                          {countrySuggestions.map((country) => (
                            <li key={country} role="option" aria-selected={formData.country === country}>
                              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { handleChange({ target: { name: "country", value: country } }); setCountrySuggestionsOpen(false); }} className="w-full rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm text-[#493b2e] hover:bg-[#f6ead8]">{isCustomCountrySuggestion ? `Use “${country}”` : country}</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Role type</span>
                  <CustomSelect className="w-full min-w-0" name="employmentType" value={formData.employmentType} onChange={handleChange} options={ROLE_TYPES.map((type) => ({ value: type, label: type }))} aria-label="Role type" maxMenuHeight={180} compact />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Experience level <span className="text-[#b96534]">*</span></span>
                  <CustomSelect className="w-full min-w-0" name="experienceRequired" value={formData.experienceRequired} onChange={handleChange} options={EXPERIENCE_LEVELS.map((level) => ({ value: level, label: level }))} placeholder="Select experience level" aria-label="Experience level" maxMenuHeight={180} compact />
                </label>
              </div>

              <section>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block"><span className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Minimum salary (INR / year)</span><input type="number" min="0" name="minSalary" value={formData.minSalary} onChange={handleChange} placeholder="e.g. 800000" className="w-full rounded-xl border border-[#ead5b7] bg-[#fffaf2] px-3.5 py-2.5 text-sm text-[#493b2e] placeholder:text-[#9b8067] outline-none focus:border-[#c26d3b] focus:bg-[#fffdfa] focus:ring-2 focus:ring-[#c26d3b]/20" /></label>
                  <label className="block"><span className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Maximum salary (INR / year)</span><input type="number" min="0" name="maxSalary" value={formData.maxSalary} onChange={handleChange} placeholder="e.g. 1200000" className="w-full rounded-xl border border-[#ead5b7] bg-[#fffaf2] px-3.5 py-2.5 text-sm text-[#493b2e] placeholder:text-[#9b8067] outline-none focus:border-[#c26d3b] focus:bg-[#fffdfa] focus:ring-2 focus:ring-[#c26d3b]/20" /></label>
                </div>
                <label className="mt-2 flex items-center gap-2 text-sm text-[#746555]"><input type="checkbox" name="showSalaryRange" checked={formData.showSalaryRange} onChange={(event) => setFormData((current) => ({ ...current, showSalaryRange: event.target.checked }))} className="h-4 w-4 accent-[#b96534]" />Show salary range on job post</label>
              </section>

              <section>
                <label htmlFor="required-skills" className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Required skills</label>
                <div className="flex gap-2"><input id="required-skills" value={skillInput} onChange={(event) => setSkillInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addSkill(); } }} placeholder="Type a skill and press Enter" className="min-w-0 flex-1 rounded-xl border border-[#ead5b7] bg-[#fffaf2] px-3.5 py-2.5 text-sm text-[#493b2e] placeholder:text-[#9b8067] outline-none focus:border-[#c26d3b] focus:bg-[#fffdfa] focus:ring-2 focus:ring-[#c26d3b]/20" /><button type="button" onClick={() => addSkill()} className="rounded-xl border border-[#ead5b7] bg-[#fffdfa] px-4 text-sm font-semibold text-[#8f4a24] hover:bg-[#fff4e2]">Add</button></div>
                {formData.skillsRequired.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{formData.skillsRequired.map((skill) => <span key={skill} className="inline-flex items-center gap-1.5 rounded-full bg-[#f6ead8] px-3 py-1 text-xs font-semibold text-[#8f4a24]">{skill}<button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`} className="text-[#8f4a24] hover:text-[#b34d37]"><HiXMark /></button></span>)}</div>}
              </section>

              <label className="block">
                <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Company</span>
                <div className="relative"><HiOutlineBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a58a6e]" /><input value={user?.companyName || formData.company} readOnly aria-readonly="true" placeholder="Add company name to your recruiter profile" className="w-full rounded-xl border border-[#ead5b7] bg-[#f6ead8] py-2.5 pl-10 pr-3.5 text-sm text-[#746555] placeholder:text-[#9b8067]" /></div>
              </label>

              <section>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><label htmlFor="job-description" className="text-xs font-extrabold uppercase tracking-wider text-[#493b2e]">Job description <span className="text-[#b96534]">*</span></label><div className="flex items-center gap-2"><button type="button" onClick={() => insertDescriptionMarkup("**", "**")} className="rounded-md border border-[#ead5b7] bg-[#fffdfa] px-2 py-1 text-xs font-bold text-[#746555] hover:bg-[#fff4e2]"><strong>B</strong></button><button type="button" onClick={() => insertDescriptionMarkup("", "", true)} className="rounded-md border border-[#ead5b7] bg-[#fffdfa] px-2 py-1 text-xs text-[#746555] hover:bg-[#fff4e2]">• List</button><button type="button" onClick={generateAIDescription} disabled={isGeneratingAI} className="rounded-md border border-[#ead5b7] bg-[#fffdfa] px-2 py-1 text-xs font-semibold text-[#8f4a24] hover:bg-[#fff4e2] disabled:opacity-50">{isGeneratingAI ? "Generating…" : "Generate with AI"}</button></div></div>
                <textarea id="job-description" ref={descriptionRef} name="description" value={formData.description} onChange={handleChange} rows={6} placeholder="Describe the role, responsibilities, and qualifications. Markdown is supported." required minLength={10} className="w-full rounded-xl border border-[#ead5b7] bg-[#fffaf2] p-3.5 text-sm text-[#493b2e] placeholder:text-[#9b8067] outline-none transition-all focus:border-[#c26d3b] focus:bg-[#fffdfa] focus:ring-2 focus:ring-[#c26d3b]/20" />
                <p className="mt-1 text-xs text-[#9b8067]">Use **text** for bold and start a line with - for bullet points.</p>
              </section>

              <button 
                type="submit" 
                className="w-full py-3 bg-[#b96534] hover:bg-[#994c24] active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0 disabled:opacity-50 mt-2"
                disabled={submitting}
              >
                {submitting ? "Saving..." : editingJob ? "Update Job" : "Post Job"}
              </button>
            </form>
          </div>
        </div>,
        document.body
        )
      )}
    </div>
  );
}

export default RecruiterDashboard;
