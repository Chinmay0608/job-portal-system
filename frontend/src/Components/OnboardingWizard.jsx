import React, { useState, useCallback } from "react";
import debounce from "lodash.debounce";
import toast from "react-hot-toast";
import {
  MapPin,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Compass,
  Briefcase,
  Layers,
  Code,
  BarChart3,
  HeartPulse,
  Video,
  Palette,
  Building2,
  Megaphone,
  DollarSign,
  Headphones,
  Check,
} from "lucide-react";
import CustomSelect from "./CustomSelect";
import { getApiBaseUrl } from "../Services/authUtils";
import { completeOnboardingAPI } from "../Services/jobService";

const DOMAIN_OPTIONS = [
  {
    id: "Software Engineering",
    title: "Software Engineering",
    desc: "Frontend, Backend, Full Stack, Mobile, DevOps, Cloud",
    icon: Code,
    color: "#2563eb",
    bg: "#eff6ff",
    suggestedSkills: ["React", "Node.js", "Python", "Java", "TypeScript", "SQL", "AWS", "Git", "Docker", "REST API"],
  },
  {
    id: "Data & Analytics",
    title: "Data & Analytics",
    desc: "Data Science, Machine Learning, AI, BI, Data Engineering",
    icon: BarChart3,
    color: "#7c3aed",
    bg: "#f5f3ff",
    suggestedSkills: ["Python", "SQL", "Pandas", "Machine Learning", "Power BI", "Tableau", "TensorFlow", "ETL"],
  },
  {
    id: "Healthcare & Medical",
    title: "Healthcare & Medical",
    desc: "Doctors, Physicians, Nursing, Clinical, Pharmacists",
    icon: HeartPulse,
    color: "#dc2626",
    bg: "#fef2f2",
    suggestedSkills: ["Patient Care", "Clinical Diagnosis", "Pharmacology", "Surgery", "Medical Records", "Healthcare Ops"],
  },
  {
    id: "Media & Video Creation",
    title: "Media & Video Creation",
    desc: "Video Editing, Production, Motion Design, YouTube/Content",
    icon: Video,
    color: "#ea580c",
    bg: "#fff7ed",
    suggestedSkills: ["Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Video Editing", "Cinematography", "Sound Design"],
  },
  {
    id: "Design & Creative",
    title: "Design & Creative",
    desc: "UI/UX, Graphic Design, Product Design, Visual Arts",
    icon: Palette,
    color: "#db2777",
    bg: "#fdf2f8",
    suggestedSkills: ["Figma", "UI/UX Design", "Photoshop", "Illustrator", "Wireframing", "User Research"],
  },
  {
    id: "Management & Operations",
    title: "Management & Operations",
    desc: "Product Manager, Project/Program, Scrum Master, Ops",
    icon: Building2,
    color: "#059669",
    bg: "#ecfdf5",
    suggestedSkills: ["Product Management", "Agile / Scrum", "Jira", "Roadmapping", "Team Leadership", "Strategy"],
  },
  {
    id: "Marketing & Sales",
    title: "Marketing & Sales",
    desc: "Digital Marketing, SEO, Sales Exec, Growth, BDR/SDR",
    icon: Megaphone,
    color: "#d97706",
    bg: "#fffbeb",
    suggestedSkills: ["Digital Marketing", "SEO / SEM", "Content Marketing", "Lead Generation", "HubSpot", "Sales Strategy"],
  },
  {
    id: "Finance & Accounting",
    title: "Finance & Accounting",
    desc: "Financial Analyst, Accountant, Tax, Audit, Payroll",
    icon: DollarSign,
    color: "#0891b2",
    bg: "#ecfeff",
    suggestedSkills: ["Financial Modeling", "Accounting", "Tally", "Excel", "Taxation", "Financial Auditing"],
  },
  {
    id: "Customer Support / Operations",
    title: "Support & Operations",
    desc: "Customer Service, Helpdesk, Client Support, Ops",
    icon: Headphones,
    color: "#4f46e5",
    bg: "#eef2ff",
    suggestedSkills: ["Customer Support", "Zendesk", "Communication", "Troubleshooting", "CRM", "Client Relations"],
  },
];

const DOMAIN_SENIORITIES = {
  "Software Engineering": [
    { level: "Intern", label: "Intern / Trainee", sub: "Pre-final / Penultimate / Freshers" },
    { level: "Entry Level", label: "Entry Level (SDE-1)", sub: "0-2 Years Experience" },
    { level: "Mid Level", label: "Mid Level (SDE-2)", sub: "2-5 Years Experience" },
    { level: "Senior Level", label: "Senior / Lead (SDE-3)", sub: "5-8 Years Experience" },
    { level: "Staff / Principal", label: "Staff / Principal Architect", sub: "8+ Years Experience" },
    { level: "Executive / Manager", label: "Engineering Manager / VP", sub: "Leadership & Management" },
  ],
  "Healthcare & Medical": [
    { level: "Intern", label: "Intern / Medical Resident", sub: "Medical Interns / Resident Doctors" },
    { level: "Entry Level", label: "Junior Doctor / General Physician", sub: "0-2 Years Medical Practice" },
    { level: "Mid Level", label: "Specialist Physician / Consultant", sub: "Specialized Residency / Fellowship" },
    { level: "Senior Level", label: "Senior Consultant / Specialist Surgeon", sub: "Senior Clinical Practice" },
    { level: "Executive / Manager", label: "Department Head / Chief Medical Officer", sub: "Hospital / Clinical Management" },
  ],
  "Media & Video Creation": [
    { level: "Intern", label: "Assistant / Intern Creator", sub: "Learning & Editing Support" },
    { level: "Entry Level", label: "Junior Video Editor / Creator", sub: "0-2 Years Editing Experience" },
    { level: "Mid Level", label: "Video Producer / Motion Designer", sub: "2-5 Years Creative Editing" },
    { level: "Senior Level", label: "Senior Director / Content Lead", sub: "Lead Creator / Production Lead" },
    { level: "Executive / Manager", label: "Creative Director / Head of Media", sub: "Studio / Media Leadership" },
  ],
  "DEFAULT": [
    { level: "Intern", label: "Intern / Trainee", sub: "Student / Fresh Trainee" },
    { level: "Entry Level", label: "Entry Level / Junior", sub: "0-2 Years Experience" },
    { level: "Mid Level", label: "Mid Level / Experienced", sub: "2-5 Years Experience" },
    { level: "Senior Level", label: "Senior / Team Lead", sub: "5-8 Years Experience" },
    { level: "Staff / Principal", label: "Principal / Lead Expert", sub: "8+ Years Domain Mastery" },
    { level: "Executive / Manager", label: "Manager / Department Head", sub: "People & Strategic Leadership" },
  ],
};

const QUALIFICATION_OPTIONS = [
  { value: "", label: "Select Degree" },
  { value: "B.Tech / B.E.", label: "B.Tech / B.E." },
  { value: "M.Tech / M.E.", label: "M.Tech / M.E." },
  { value: "BCA / MCA", label: "BCA / MCA" },
  { value: "MBBS / MD / MS", label: "MBBS / MD / MS (Healthcare)" },
  { value: "B.Des / M.Des", label: "B.Des / M.Des (Design)" },
  { value: "BBA / MBA", label: "BBA / MBA (Management)" },
  { value: "B.Com / M.Com", label: "B.Com / M.Com (Finance)" },
  { value: "Bachelor's Degree (Other)", label: "Bachelor's Degree (Other)" },
  { value: "Master's Degree (Other)", label: "Master's Degree (Other)" },
  { value: "High School / Diploma", label: "High School / Diploma" },
];

const EXPERIENCE_OPTIONS = [
  { value: "Fresher", label: "Fresher / Student" },
  { value: "0-2 Years", label: "0-2 Years" },
  { value: "2-5 Years", label: "2-5 Years" },
  { value: "5+ Years", label: "5+ Years" },
];

const POPULAR_LOCATIONS = [
  "Bengaluru, Karnataka",
  "Mumbai, Maharashtra",
  "Delhi NCR (Delhi, Noida, Gurgaon)",
  "Hyderabad, Telangana",
  "Pune, Maharashtra",
  "Chennai, Tamil Nadu",
  "Noida, Uttar Pradesh",
  "Gurugram, Haryana",
  "Kolkata, West Bengal",
  "Ahmedabad, Gujarat",
  "Chandigarh",
  "Jaipur, Rajasthan",
  "Kochi, Kerala",
  "Indore, Madhya Pradesh",
  "Coimbatore, Tamil Nadu",
  "Thiruvananthapuram, Kerala",
  "Bhubaneswar, Odisha",
  "Lucknow, Uttar Pradesh",
  "Remote / Work From Home",
];

const QUICK_LOCATION_PILLS = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Remote",
];

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [field, setField] = useState(user?.field || "Software Engineering");
  const [targetSeniority, setTargetSeniority] = useState(
    Array.isArray(user?.targetSeniority) && user.targetSeniority.length > 0
      ? user.targetSeniority
      : ["Entry Level", "Mid Level"]
  );
  const [location, setLocation] = useState(user?.location || "");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);
  const [highestQualification, setHighestQualification] = useState(
    user?.highestQualification || user?.education || ""
  );
  const [experienceLevel, setExperienceLevel] = useState(
    user?.experienceLevel || "Fresher"
  );
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedDomainObj = DOMAIN_OPTIONS.find((d) => d.id === field) || DOMAIN_OPTIONS[0];
  const seniorityList = DOMAIN_SENIORITIES[field] || DOMAIN_SENIORITIES["DEFAULT"];

  const toggleSeniorityLevel = (levelStr) => {
    setTargetSeniority((prev) => {
      if (prev.includes(levelStr)) {
        if (prev.length === 1) {
          toast.error("Please select at least one target seniority level.");
          return prev;
        }
        return prev.filter((l) => l !== levelStr);
      } else {
        return [...prev, levelStr];
      }
    });
  };

  const handleLocationChange = (val) => {
    setLocation(val);
    setActiveLocationIndex(-1);
    if (!val.trim()) {
      setLocationSuggestions(POPULAR_LOCATIONS.slice(0, 6));
      setIsLocationDropdownOpen(true);
    } else {
      const q = val.toLowerCase().trim();
      const matches = POPULAR_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(q)
      );
      setLocationSuggestions(matches);
      setIsLocationDropdownOpen(true);
    }
  };

  const handleSelectLocation = (loc) => {
    setLocation(loc);
    setIsLocationDropdownOpen(false);
    setActiveLocationIndex(-1);
  };

  const API_BASE_URL = getApiBaseUrl();

  const fetchSkillSuggestions = async (query) => {
    try {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/api/jobs/skills/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        setSuggestions([]);
        return;
      }
      const data = await response.json();
      const filtered = (Array.isArray(data) ? data : []).filter(
        (skill) => !skills.some((s) => s.toLowerCase() === skill.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
      setSuggestions([]);
    }
  };

  const debouncedSkillSearch = useCallback(
    debounce((query) => {
      fetchSkillSuggestions(query);
    }, 250),
    [skills]
  );

  const handleSkillInputChange = (value) => {
    setActiveSuggestionIndex(-1);
    setSkillInput(value);
    if (value.trim().length > 0) {
      debouncedSkillSearch(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleAddSkill = (skillName) => {
    const trimmed = (skillName || "").trim();
    if (!trimmed) return;

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSkillInput("");
      setErrorMsg("Email addresses cannot be added as skills.");
      return;
    }

    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      setSuggestions([]);
      return;
    }

    const matchedSkill = suggestions.find(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    const finalSkill = matchedSkill || trimmed;
    setSkills((prev) => [...prev, finalSkill]);
    setSkillInput("");
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setErrorMsg("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveAndComplete = async (isSkip = false) => {
    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const payload = {
        field,
        targetSeniority,
        location: location.trim(),
        highestQualification,
        experienceLevel,
        skills,
      };

      const res = await completeOnboardingAPI(payload);

      if (res?.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
        if (isSkip) {
          toast.success("Welcome to SkillBridge! You can update your profile anytime.");
        } else {
          toast.success("🎉 Welcome aboard! Your personalized job feed is calibrated.");
        }
        if (onComplete) {
          onComplete(res.user);
        }
      }
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      const msg =
        err?.response?.data?.message ||
        "Failed to save onboarding data. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !field) {
      setErrorMsg("Please select a target job domain to proceed.");
      return;
    }
    if (step === 2 && targetSeniority.length === 0) {
      setErrorMsg("Please select at least one position level you wish to apply for.");
      return;
    }
    if (step === 4 && skills.length < 3) {
      setErrorMsg(
        `Please add at least 3 skills (${skills.length}/3 added) to continue. Skill matching gives you the highest precision relevance score!`
      );
      return;
    }
    setErrorMsg("");
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const progressPercentage = Math.round((step / 5) * 100);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* PROGRESS BAR & HEADER */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #f1f5f9",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <Compass size={16} />
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", letterSpacing: "-0.01em" }}>
                SkillBridge Radar Onboarding
              </span>
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#475569",
                background: "#e2e8f0",
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              Step {step} of 5
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "6px",
              backgroundColor: "#e2e8f0",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercentage}%`,
                height: "100%",
                backgroundColor: "#2563eb",
                transition: "width 0.3s ease",
                borderRadius: "999px",
              }}
            />
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: "8px",
                fontSize: "0.88rem",
                fontWeight: 500,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* STEP 1: TARGET DOMAIN / PROFESSION */}
          {step === 1 && (
            <div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <Briefcase size={22} />
              </div>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                What job domain are you targeting?
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "18px",
                }}
              >
                Select your primary industry or profession. We filter out irrelevant roles and match you strictly within your target field.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "10px",
                  maxHeight: "340px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {DOMAIN_OPTIONS.map((item) => {
                  const isSelected = field === item.id;
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setField(item.id);
                        setErrorMsg("");
                      }}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: isSelected
                          ? `2px solid ${item.color}`
                          : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? item.bg : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        boxShadow: isSelected ? `0 4px 12px ${item.color}20` : "none",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: item.bg,
                          color: item.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconComp size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color: isSelected ? item.color : "#1e293b",
                            marginBottom: "2px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{item.title}</span>
                          {isSelected && <Check size={16} style={{ color: item.color }} />}
                        </div>
                        <p style={{ fontSize: "0.76rem", color: "#64748b", margin: 0, lineHeight: "1.3" }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SENIORITY LEVEL CHECKLIST */}
          {step === 2 && (
            <div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <Layers size={22} />
              </div>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Which positions can you apply for?
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "16px",
                }}
              >
                Select all seniority levels for <strong>{field}</strong> that match your experience and career goals (lowest to highest).
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {seniorityList.map((item) => {
                  const isChecked = targetSeniority.includes(item.level);
                  return (
                    <label
                      key={item.level}
                      onClick={() => toggleSeniorityLevel(item.level)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: isChecked ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        backgroundColor: isChecked ? "#eff6ff" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "6px",
                            border: isChecked ? "2px solid #2563eb" : "2px solid #cbd5e1",
                            backgroundColor: isChecked ? "#2563eb" : "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1e293b" }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "999px",
                          backgroundColor: isChecked ? "#bfdbfe" : "#f1f5f9",
                          color: isChecked ? "#1e40af" : "#64748b",
                        }}
                      >
                        {isChecked ? "Selected" : "Select"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION & BACKGROUND */}
          {step === 3 && (
            <div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <MapPin size={22} />
              </div>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Where are you based & background?
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "18px",
                }}
              >
                We'll prioritize local jobs and highlight remote opportunities worldwide.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    City / Preferred Location
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      placeholder="e.g. Bengaluru, Mumbai, Delhi, Remote"
                      autoFocus
                      onKeyDown={(e) => {
                        if (isLocationDropdownOpen && locationSuggestions.length > 0) {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActiveLocationIndex((prev) => (prev + 1) % locationSuggestions.length);
                            return;
                          }
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActiveLocationIndex((prev) => (prev - 1 + locationSuggestions.length) % locationSuggestions.length);
                            return;
                          }
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (activeLocationIndex >= 0 && activeLocationIndex < locationSuggestions.length) {
                              handleSelectLocation(locationSuggestions[activeLocationIndex]);
                            } else {
                              setIsLocationDropdownOpen(false);
                              handleNext();
                            }
                            return;
                          }
                        } else if (e.key === "Enter") {
                          handleNext();
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.92rem",
                        color: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#2563eb";
                        handleLocationChange(location);
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#cbd5e1";
                        setTimeout(() => setIsLocationDropdownOpen(false), 200);
                      }}
                    />

                    {isLocationDropdownOpen && locationSuggestions.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: "#ffffff",
                          borderRadius: "10px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                          border: "1px solid #e2e8f0",
                          maxHeight: "180px",
                          overflowY: "auto",
                        }}
                      >
                        {locationSuggestions.map((item, idx) => (
                          <div
                            key={item}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectLocation(item);
                            }}
                            onMouseEnter={() => setActiveLocationIndex(idx)}
                            style={{
                              padding: "10px 14px",
                              fontSize: "0.88rem",
                              cursor: "pointer",
                              backgroundColor:
                                idx === activeLocationIndex ? "#eff6ff" : "#ffffff",
                              color: idx === activeLocationIndex ? "#2563eb" : "#1e293b",
                              fontWeight: idx === activeLocationIndex ? 600 : 500,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <MapPin size={14} style={{ color: idx === activeLocationIndex ? "#2563eb" : "#94a3b8" }} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {QUICK_LOCATION_PILLS.map((city) => {
                      const isSelected = location.toLowerCase().includes(city.toLowerCase());
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleSelectLocation(city)}
                          style={{
                            background: isSelected ? "#2563eb" : "#f1f5f9",
                            color: isSelected ? "#ffffff" : "#475569",
                            border: "1px solid",
                            borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                            borderRadius: "999px",
                            padding: "4px 10px",
                            fontSize: "0.78rem",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          📍 {city}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Highest Degree
                    </label>
                    <CustomSelect
                      options={QUALIFICATION_OPTIONS}
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      placeholder="Select Degree"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                      Experience Level
                    </label>
                    <CustomSelect
                      options={EXPERIENCE_OPTIONS}
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      placeholder="Select Experience"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SKILLS */}
          {step === 4 && (
            <div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <Sparkles size={22} />
              </div>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                What are your top skills for {field}?
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "12px",
                }}
              >
                Add at least <strong>3 to 5 key skills</strong>. We match your skills directly against employer postings for 0–100 relevance scoring.
              </p>

              {/* COUNTER BADGE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: skills.length >= 3 ? "#f0fdf4" : "#eff6ff",
                  border: `1px solid ${skills.length >= 3 ? "#bbf7d0" : "#bfdbfe"}`,
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: skills.length >= 3 ? "#15803d" : "#1d4ed8",
                  }}
                >
                  {skills.length >= 3
                    ? `✓ Excellent! ${skills.length} skills added`
                    : `Please add ${3 - skills.length} more skill${3 - skills.length > 1 ? "s" : ""} (${skills.length}/3 minimum)`}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: skills.length >= 3 ? "#16a34a" : "#2563eb",
                    backgroundColor: "#ffffff",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    border: `1px solid ${skills.length >= 3 ? "#bbf7d0" : "#bfdbfe"}`,
                  }}
                >
                  {skills.length} / 3 min
                </span>
              </div>

              <div style={{ position: "relative", marginBottom: "14px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => handleSkillInputChange(e.target.value)}
                    placeholder="Type a skill..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (
                          activeSuggestionIndex >= 0 &&
                          activeSuggestionIndex < suggestions.length
                        ) {
                          handleAddSkill(suggestions[activeSuggestionIndex]);
                        } else {
                          handleAddSkill(skillInput);
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.92rem",
                      color: "#1e293b",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skillInput)}
                    disabled={!skillInput.trim()}
                    style={{
                      padding: "0 18px",
                      background: skillInput.trim() ? "#2563eb" : "#cbd5e1",
                      color: "#ffffff",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: skillInput.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    Add
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: "#ffffff",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                      border: "1px solid #e2e8f0",
                      maxHeight: "180px",
                      overflowY: "auto",
                    }}
                  >
                    {suggestions.map((item, idx) => (
                      <div
                        key={item}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddSkill(item);
                        }}
                        style={{
                          padding: "10px 14px",
                          fontSize: "0.88rem",
                          cursor: "pointer",
                          backgroundColor:
                            idx === activeSuggestionIndex ? "#eff6ff" : "#ffffff",
                          color: idx === activeSuggestionIndex ? "#2563eb" : "#1e293b",
                          fontWeight: idx === activeSuggestionIndex ? 600 : 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{item}</span>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>+ Add</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CHOSEN SKILLS BADGES */}
              <div
                style={{
                  minHeight: "70px",
                  padding: "10px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px dashed #cbd5e1",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  alignItems: "center",
                  alignContent: "flex-start",
                }}
              >
                {skills.length === 0 ? (
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", margin: "auto" }}>
                    No skills added yet. Type a skill or tap suggestions below!
                  </span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 12px",
                        borderRadius: "999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          padding: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* DOMAIN SUGGESTED SKILLS PILLS */}
              <div style={{ marginTop: "14px" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Suggested for {field} (tap to add):
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(selectedDomainObj.suggestedSkills || []).filter(
                    (s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
                  ).map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handleAddSkill(pill)}
                      style={{
                        background: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #e2e8f0",
                        borderRadius: "999px",
                        padding: "4px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      + {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FINAL CONFIRMATION */}
          {step === 5 && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Your SkillBridge Radar is Ready! 🚀
              </h2>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "20px",
                  maxWidth: "420px",
                  margin: "0 auto 20px",
                }}
              >
                We've configured your feed with 0–100 relevance scoring based on your domain, target seniority checklist, and skill matrix.
              </p>

              {/* SUMMARY CARD */}
              <div
                style={{
                  textAlign: "left",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "16px 20px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                  Radar Preferences Profile
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Target Domain: </span>
                    <strong style={{ color: "#1e293b" }}>{field}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Target Seniority: </span>
                    <strong style={{ color: "#2563eb" }}>{targetSeniority.join(", ")}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Location: </span>
                      <strong style={{ color: "#1e293b" }}>{location || "Flexible / Remote"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Degree: </span>
                      <strong style={{ color: "#1e293b" }}>{highestQualification || "Not specified"}</strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Skills Matrix ({skills.length}): </span>
                    <span style={{ color: "#334155", fontWeight: 600 }}>{skills.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #f1f5f9",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(step === 3 || step === 4) && (
              <button
                type="button"
                onClick={() => handleSaveAndComplete(true)}
                disabled={isSubmitting}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  textDecoration: "underline",
                }}
              >
                Skip remaining
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                }}
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveAndComplete(false)}
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 28px",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Calibrating feed...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
