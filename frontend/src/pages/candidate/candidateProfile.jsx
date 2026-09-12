import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import debounce from "lodash.debounce";
import CustomSelect from "../../Components/CustomSelect";
import { 
  changePassword, 
  updateProfile, 
  extractSkillsAPI, 
  getUserProfile, 
  getMyApplications, 
  getResumeSignedUrlAPI 
} from "../../Services/jobService";
import { 
  Camera, 
  FileText, 
  Sparkles, 
  Eye, 
  Download, 
  Upload, 
  X, 
  Check, 
  Lock, 
  Bell, 
  Plus, 
  Briefcase, 
  Bookmark
} from "lucide-react";

// Curated list of popular tech & domain skills for instant 0ms local autocomplete
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#", "C",
  "SQL", "MongoDB", "PostgreSQL", "MySQL", "AWS", "Docker", "Kubernetes", "Git",
  "HTML5", "CSS3", "Express.js", "Next.js", "Redux", "Tailwind CSS", "GraphQL", "REST APIs",
  "Data Structures", "Algorithms", "Machine Learning", "Deep Learning", "Data Analysis",
  "Figma", "UI/UX Design", "DevOps", "Cybersecurity", "Linux", "Go", "Rust", "Swift",
  "Kotlin", "Flutter", "React Native", "Spring Boot", "Django", "FastAPI", "Pandas",
  "NumPy", "TensorFlow", "PyTorch", "Tableau", "Power BI", "Agile", "Scrum", "Jira"
];

function CandidateProfile() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  /* Safe User Parse */
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("User Parse Error:", error);
  }

  // 1. Core State
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(false);
  const [savedCompletion, setSavedCompletion] = useState(0);

  // 2. Input Fields State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [github, setGithub] = useState(user?.github || "");
  const [about, setAbout] = useState(user?.about || "");
  const [education, setEducation] = useState(user?.education || "");
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || "Fresher");
  const [field, setField] = useState(user?.field || "Software Engineering");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    user?.emailNotificationsEnabled !== undefined ? user.emailNotificationsEnabled : true
  );

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Helper to sanitize skills and discard any accidentally saved emails
  const sanitizeSkills = (list) =>
    (Array.isArray(list) ? list : []).filter(
      (s) => typeof s === "string" && !/^[^s@]+@[^s@]+.[^s@]+$/.test(s.trim())
    );

  // Dynamic User Saved Skills
  const [skills, setSkills] = useState(() => sanitizeSkills(user?.skills));
  const [skillInput, setSkillInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [skillError, setSkillError] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const skillBoxRef = useRef(null);

  // Auto-clear skillInput if browser aggressively autofills an email address into it
  useEffect(() => {
    if (skillInput && /^[^s@]+@[^s@]+.[^s@]+$/.test(skillInput.trim())) {
      setSkillInput("");
    }
  }, [skillInput]);

  // Click outside to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skillBoxRef.current && !skillBoxRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. File Uploads State
  const [profileImage, setProfileImage] = useState(null);
  const [resume, setResume] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [applicationsCount, setApplicationsCount] = useState(
    storedUser?.applicationsCount !== undefined ? storedUser.applicationsCount : 0
  );
  const [savedJobsCount, setSavedJobsCount] = useState(
    storedUser?.savedJobsCount !== undefined ? storedUser.savedJobsCount : (storedUser?.savedJobs?.length || 0)
  );

  // Profile Completion Calculation Matrix — candidate-specific fields
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
      profileUser?.field,
      profileUser?.skills?.length > 0,
      profileUser?.resume,
      profileUser?.profileImage,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  // Mount effect: Fetch fresh profile data
  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const [res, appRes] = await Promise.all([
          getUserProfile().catch(() => null),
          getMyApplications().catch(() => null),
        ]);

        if (res?.user) {
          setUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
          if (res.user.applicationsCount !== undefined) {
            setApplicationsCount(res.user.applicationsCount);
          }
          if (res.user.savedJobs) {
            setSavedJobsCount(res.user.savedJobs.length);
          }
        }

        if (appRes?.applications) {
          setApplicationsCount(appRes.applications.length);
        }
      } catch (err) {
        console.error("Failed to fetch fresh profile data:", err);
      }
    };
    fetchFreshProfile();
  }, []);

  // State Synchronization Block
  useEffect(() => {
    if (user) {
      setSavedCompletion(calculateCompletion(user));
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setLocation(user.location || "");
      setLinkedin(user.linkedin || "");
      setGithub(user.github || "");
      setAbout(user.about || "");
      setSkills(sanitizeSkills(user.skills));
      setEducation(user.education || "");
      setExperienceLevel(user.experienceLevel || "Fresher");
      setField(user.field || "Software Engineering");
      setEmailNotificationsEnabled(user.emailNotificationsEnabled !== undefined ? user.emailNotificationsEnabled : true);
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("location", location);
      formData.append("linkedin", linkedin);
      formData.append("github", github);
      formData.append("about", about);
      formData.append("skills", JSON.stringify(skills));
      formData.append("education", education);
      formData.append("experienceLevel", experienceLevel);
      formData.append("field", field);
      formData.append("emailNotificationsEnabled", emailNotificationsEnabled);

      if (resume) formData.append("resume", resume);
      if (profileImage) formData.append("profileImage", profileImage);

      const response = await updateProfile(formData);

      if (response.extractedSkills && response.extractedSkills.length > 0) {
        toast.success(`Magically extracted ${response.extractedSkills.length} skills from your resume: ${response.extractedSkills.join(", ")}!`);
      } else {
        toast.success(response.message || "Profile updated successfully!");
      }

      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);
      
      // Immediately update local skills state if backend added new ones
      setSkills(response.user.skills || []);

      setResume(null);
      setProfileImage(null);
    } catch (error) {
      console.error("Update Error:", error);
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setResumeUploading(true);
      const formData = new FormData();
      formData.append("resume", file);
      const response = await updateProfile(formData);

      if (response.extractedSkills && response.extractedSkills.length > 0) {
        toast.success(`Magically extracted ${response.extractedSkills.length} skills from your resume!`);
      } else {
        toast.success("✓ Resume uploaded and saved to your profile!");
      }

      if (response.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser(response.user);
        if (response.user.skills) {
          setSkills(sanitizeSkills(response.user.skills));
        }
      }
      setResume(null);
    } catch (err) {
      console.error("Resume upload error:", err);
      toast.error(err?.response?.data?.message || "Failed to upload resume");
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  };

  const handlePreviewResume = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    try {
      setLoading(true);
      const data = await getResumeSignedUrlAPI(user._id);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Resume file not found.");
      }
    } catch (err) {
      console.error("Preview resume error:", err);
      toast.error("Failed to open resume preview");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    try {
      setLoading(true);
      const data = await getResumeSignedUrlAPI(user._id);
      if (data?.signedUrl) {
        const response = await fetch(data.signedUrl);
        const rawBlob = await response.blob();
        const blob = new Blob([rawBlob], { type: 'application/pdf' });
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${user.name ? user.name.replace(/\s+/g, "_") : "Candidate"}_Resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        toast.error("Resume file not found.");
      }
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to download resume");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await changePassword({ currentPassword, newPassword, confirmNewPassword });
      toast.success(response.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Password Change Error:", error);
      toast.error(error?.response?.data?.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skillName) => {
    const trimmed = (skillName || "").trim();
    
    // Validate: skill name must not be empty
    if (!trimmed) {
      setSkillError("");
      return;
    }

    // Guard against email addresses autofilled by browsers
    if (/^[^s@]+@[^s@]+.[^s@]+$/.test(trimmed)) {
      setSkillInput("");
      setSkillError("Email addresses cannot be added as skills.");
      return;
    }

    // Validate: check if skill already exists in user's skills array
    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    // Find case-insensitive match in suggestions array if available
    const matchedSkill = suggestions.find(
      (suggestion) => suggestion.toLowerCase() === trimmed.toLowerCase()
    );

    const skillToAdd = matchedSkill || trimmed;
    setSkills((prevSkills) => [...prevSkills, skillToAdd]);
    setSkillInput("");
    setSuggestions([]);
    setIsDropdownOpen(false);
    setSkillError("");
  };

  const handleExtractSkills = async () => {
    if (!user?.resume) {
      toast.error("Please upload and save your resume first!");
      return;
    }
    
    try {
      setLoading(true);
      const data = await extractSkillsAPI();
      
      if (data.extractedSkills && data.extractedSkills.length > 0) {
        toast.success(`Magically extracted ${data.extractedSkills.length} new skills!`);
        setSkills(data.user.skills);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        toast.success(data.message || "No new skills found.");
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error(error?.response?.data?.message || "Failed to extract skills.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced API search using useRef to preserve timer identity across re-renders
  const debouncedFetchApiRef = useRef(
    debounce(async (query, currentSkills) => {
      try {
        if (!query.trim()) return;
        const res = await fetch(
          `${API_URL}/api/jobs/skills/search?query=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const apiSkills = await res.json();
          if (Array.isArray(apiSkills)) {
            setSuggestions((prev) => {
              const combined = Array.from(
                new Set([...prev, ...apiSkills])
              ).filter((s) => !currentSkills.some((sk) => sk.toLowerCase() === s.toLowerCase()));
              return combined.slice(0, 10);
            });
          }
        }
      } catch (err) {
        console.error("Skill search API error:", err);
      }
    }, 200)
  );

  const handleSkillInputChange = (value) => {
    setActiveSuggestionIndex(-1);
    setSkillInput(value);

    const trimmed = value.trim().toLowerCase();
    if (trimmed.length > 0) {
      setSkillError("");
      
      // 1. Instant local matching (0ms response)
      const localMatches = COMMON_SKILLS.filter(
        (s) =>
          s.toLowerCase().includes(trimmed) &&
          !skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
      );
      
      setSuggestions(localMatches.slice(0, 8));
      setIsDropdownOpen(true);

      // 2. Query backend for comprehensive MasterSkill matches
      debouncedFetchApiRef.current(value, skills);
    } else {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setSkillError("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/70 text-slate-900 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: SIDEBAR */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center lg:sticky lg:top-24">

          <div className="relative mb-4">
            {user?.profileImage ? (
              <img
                src={user.profileImage.startsWith("http") ? user.profileImage : `${API_URL}/${user.profileImage.replace(/^\/+/, "")}`}
                alt="profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white text-3xl font-extrabold flex items-center justify-center border-4 border-slate-100 shadow-md">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}

            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105 active:scale-95" title="Change Avatar">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setProfileImage(e.target.files[0])}
              />
            </label>
          </div>

          <h2 className="text-xl font-bold text-slate-900 m-0">{user?.name || "Guest User"}</h2>
          <p className="text-xs text-slate-500 mt-1 mb-3 break-all">{user?.email}</p>
          <span className="px-3 py-1 bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold rounded-full uppercase tracking-wider mb-5">
            {user?.role || "Candidate"}
          </span>

          {/* Profile Strength */}
          <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Profile Strength</span>
              <span className="text-brand-600 font-extrabold">{savedCompletion}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${savedCompletion}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Briefcase size={12} /> Applications
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">{applicationsCount}</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1">
                  <Bookmark size={12} /> Saved Jobs
                </div>
                <div className="text-lg font-extrabold text-slate-900 mt-0.5">{savedJobsCount}</div>
              </div>
            </div>
          </div>

          {/* Resume Management */}
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <FileText size={15} className="text-brand-600" /> Resume / CV
            </h3>
            
            {user?.resume && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handlePreviewResume}
                  disabled={loading || resumeUploading}
                  className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={13} /> Preview
                </button>
                <button
                  type="button"
                  onClick={handleDownloadResume}
                  disabled={loading || resumeUploading}
                  className="flex-1 py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Download size={13} /> Download
                </button>
              </div>
            )}

            <label
              className={`w-full py-2.5 px-3 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                resumeUploading
                  ? "bg-brand-50 border-brand-300 text-brand-600 opacity-70 cursor-not-allowed"
                  : user?.resume
                  ? "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700"
                  : "bg-brand-50 hover:bg-brand-100 border-brand-300 text-brand-700"
              }`}
            >
              <Upload size={14} />
              {resumeUploading
                ? "Uploading & parsing..."
                : user?.resume
                ? "Replace resume file"
                : "Upload resume (PDF, DOC)"}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                hidden
                disabled={resumeUploading}
                onChange={handleResumeFileChange}
              />
            </label>

            {resumeUploading ? (
              <p className="text-[11px] text-brand-600 font-semibold mt-2 text-center">
                ⏳ Uploading and saving to profile...
              </p>
            ) : user?.resume ? (
              <p className="text-[11px] text-emerald-600 font-semibold mt-2 text-center flex items-center justify-center gap-1">
                <Check size={12} className="stroke-[3]" /> Resume is active on your profile
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Upload PDF or DOCX to unlock 1-click apply & AI parsing.
              </p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN FORM WORKSPACE */}
        <div className="lg:col-span-8 space-y-6">

          {/* Page Header */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Candidate Profile</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1 mb-1">My Profile</h1>
            <p className="text-xs sm:text-sm text-slate-500 m-0">
              Keep this information updated — hiring managers and AI matching use this to recommend you the best jobs.
            </p>
          </div>

          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  disabled
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g., +91 98765 43210" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g., Jaipur, India / Remote" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              {/* Highest Qualification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Highest Qualification</label>
                <CustomSelect
                  options={[
                    { value: "", label: "Select Degree" }, 
                    { value: "B.Tech", label: "B.Tech / B.E." }, 
                    { value: "M.Tech", label: "M.Tech / M.E." }, 
                    { value: "BCA", label: "BCA" }, 
                    { value: "MCA", label: "MCA" },
                    { value: "B.Sc", label: "B.Sc Computer Science" },
                    { value: "Other", label: "Other Graduate / Diploma" }
                  ]}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Experience Level</label>
                <CustomSelect
                  options={[
                    { value: "Fresher", label: "Fresher / Entry Level" }, 
                    { value: "0-2 Years", label: "0-2 Years (Junior)" }, 
                    { value: "2-5 Years", label: "2-5 Years (Mid-Level)" }, 
                    { value: "5+ Years", label: "5+ Years (Senior/Lead)" }
                  ]}
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              {/* Domain / Field of Work */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Domain / Field of Work</label>
                <CustomSelect
                  options={[
                    { value: "Software Engineering", label: "Software Engineering / IT" },
                    { value: "Data Science & Analytics", label: "Data Science & Analytics" },
                    { value: "Product Management", label: "Product Management" },
                    { value: "UI/UX & Design", label: "UI/UX & Design" },
                    { value: "DevOps & Cloud", label: "DevOps & Infrastructure" },
                    { value: "Marketing & Growth", label: "Marketing & Content" },
                    { value: "Sales & BD", label: "Sales & Business Development" },
                    { value: "Finance & Accounting", label: "Finance & Accounting" },
                    { value: "HR & Operations", label: "HR & People Operations" },
                    { value: "Core Engineering", label: "Core / Mechanical Engineering" }
                  ]}
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="w-full text-sm"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">LinkedIn Profile</label>
                <input 
                  type="text" 
                  placeholder="linkedin.com/in/username" 
                  value={linkedin} 
                  onChange={(e) => setLinkedin(e.target.value)} 
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">GitHub / Portfolio</label>
                <input 
                  type="text" 
                  placeholder="github.com/username" 
                  value={github} 
                  onChange={(e) => setGithub(e.target.value)} 
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              {/* About */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">About You / Summary</label>
                <textarea 
                  rows={3}
                  placeholder="Brief summary of your skills, background, and what you're looking for..." 
                  value={about} 
                  onChange={(e) => setAbout(e.target.value)} 
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* Skills Engine Block (Ticket 2 Fix) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 m-0">Skills & Tech Stack</h2>
                <p className="text-xs text-slate-500 m-0 mt-0.5">Add your key technical and professional skills for matching</p>
              </div>
              {user?.resume && (
                <button 
                  type="button"
                  onClick={handleExtractSkills}
                  disabled={loading}
                  className="self-start sm:self-auto py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles size={13} className="text-indigo-600" />
                  Extract from Resume
                </button>
              )}
            </div>

            {/* Input & Autocomplete Dropdown */}
            <div ref={skillBoxRef} className="relative w-full mb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="candidate_skill_search_query"
                    id="candidate_skill_search_query"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    placeholder="Type a skill (e.g. React, Python, Docker, SQL)..."
                    value={skillInput}
                    onChange={(e) => handleSkillInputChange(e.target.value)}
                    onFocus={() => {
                      if (skillInput.trim().length > 0 && suggestions.length > 0) {
                        setIsDropdownOpen(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        if (activeSuggestionIndex < suggestions.length - 1) {
                          setActiveSuggestionIndex((prev) => prev + 1);
                        }
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        if (activeSuggestionIndex > 0) {
                          setActiveSuggestionIndex((prev) => prev - 1);
                        }
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                          handleAddSkill(suggestions[activeSuggestionIndex]);
                        } else {
                          handleAddSkill(skillInput);
                        }
                        setActiveSuggestionIndex(-1);
                      } else if (e.key === "Escape") {
                        setIsDropdownOpen(false);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>

                <button 
                  type="button" 
                  onClick={() => handleAddSkill(skillInput)}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto z-50 py-1 divide-y divide-slate-100">
                  {suggestions.map((suggestion, index) => (
                    <button
                      type="button"
                      key={suggestion}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer border-0 ${
                        index === activeSuggestionIndex 
                          ? "bg-brand-50 text-brand-700 font-bold" 
                          : "bg-white text-slate-800 hover:bg-slate-50"
                      }`}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onClick={() => {
                        handleAddSkill(suggestion);
                        setActiveSuggestionIndex(-1);
                      }}
                    >
                      <span>{suggestion}</span>
                      <Plus size={12} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {skillError && <p className="text-xs text-rose-600 font-medium mb-3">{skillError}</p>}

            {/* Skill Badges / Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {skills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No skills added yet — type and add your skills above.</span>
              ) : (
                skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>{skill}</span>
                    <button 
                      type="button" 
                      onClick={() => removeSkill(skill)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-white/80 transition-colors border-0 bg-transparent cursor-pointer"
                      title={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Lock size={16} className="text-slate-600" /> Change Password
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChangePassword();
              }}
              autoComplete="off"
            >
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={email || ""}
                readOnly
                style={{ display: "none" }}
                tabIndex="-1"
                aria-hidden="true"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                  <input
                    type="password"
                    name="current-password"
                    autoComplete="current-password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Job Alerts & Notification Preferences */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Bell size={16} className="text-slate-600" /> Job Alerts & Email Digest
            </h2>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="emailNotificationsToggle"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 mt-1 cursor-pointer accent-brand-600 rounded"
              />
              <div>
                <label htmlFor="emailNotificationsToggle" className="block text-sm font-bold text-slate-800 cursor-pointer">
                  Email me about new matching jobs & openings
                </label>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  Receive job alert digests with opportunities tailored directly to your skills and field whenever new positions are posted or synced.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Save Bar */}
          <div className="flex justify-end pt-2">
            <button 
              type="button" 
              onClick={handleSave} 
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-brand-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Saving Profile..." : "Save Profile Changes"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CandidateProfile;
