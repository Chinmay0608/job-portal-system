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
} from "lucide-react";
import CustomSelect from "./CustomSelect";
import { completeOnboardingAPI } from "../Services/jobService";

const QUALIFICATION_OPTIONS = [
  { value: "", label: "Select Degree" },
  { value: "B.Tech", label: "B.Tech" },
  { value: "M.Tech", label: "M.Tech" },
  { value: "BCA", label: "BCA" },
  { value: "MCA", label: "MCA" },
];

const EXPERIENCE_OPTIONS = [
  { value: "Fresher", label: "Fresher" },
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

const POPULAR_SUGGESTED_SKILLS = [
  "React",
  "Node.js",
  "JavaScript",
  "Python",
  "Java",
  "SQL",
  "HTML/CSS",
  "Git",
  "AWS",
  "Excel",
  "Data Analysis",
  "Communication",
];

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(1);
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Debounced skill suggestion search from backend API
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
          toast.success("🎉 Welcome aboard! Your personalized job feed is ready.");
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
    if (step === 3 && skills.length < 3) {
      setErrorMsg(
        `Please add at least 3 skills (${skills.length}/3 added) to continue. Adding 3 to 5 skills ensures the most accurate job recommendations!`
      );
      return;
    }
    setErrorMsg("");
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const progressPercentage = Math.round((step / 4) * 100);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
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
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
        style={{
          width: "100%",
          maxWidth: "540px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          overflow: "hidden",
        }}
      >
        {/* PROGRESS BAR & STEP COUNTER */}
        <div
          style={{
            padding: "20px 24px 16px",
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
                Candidate Onboarding
              </span>
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#64748b",
                background: "#e2e8f0",
                padding: "3px 10px",
                borderRadius: "999px",
              }}
            >
              Step {step} of 4
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
        <div style={{ padding: "28px 28px 20px" }}>
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

          {/* STEP 1: LOCATION */}
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
                Where are you based?
              </h2>
              <p
                style={{
                  fontSize: "0.92rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "22px",
                }}
              >
                We'll prioritize opportunities near you and highlight matching remote jobs.
              </p>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  City or Preferred Location
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    placeholder="e.g., Bengaluru, Mumbai, Delhi, Remote"
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
                        if (e.key === "Escape") {
                          setIsLocationDropdownOpen(false);
                          return;
                        }
                      } else if (e.key === "Enter") {
                        handleNext();
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.95rem",
                      color: "#1e293b",
                      outline: "none",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.12)";
                      handleLocationChange(location);
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#cbd5e1";
                      e.target.style.boxShadow = "none";
                      setTimeout(() => setIsLocationDropdownOpen(false), 200);
                    }}
                  />

                  {/* AUTOCOMPLETE SUGGESTIONS POPUP */}
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
                        maxHeight: "200px",
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
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            backgroundColor:
                              idx === activeLocationIndex ? "#eff6ff" : "#ffffff",
                            color: idx === activeLocationIndex ? "#2563eb" : "#1e293b",
                            fontWeight: idx === activeLocationIndex ? 600 : 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            borderBottom:
                              idx !== locationSuggestions.length - 1
                                ? "1px solid #f1f5f9"
                                : "none",
                          }}
                        >
                          <MapPin size={15} style={{ color: idx === activeLocationIndex ? "#2563eb" : "#94a3b8", flexShrink: 0 }} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* QUICK SELECTION PILLS */}
                <div style={{ marginTop: "16px" }}>
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
                    Popular Hubs:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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
                            padding: "5px 12px",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "#e2e8f0";
                              e.currentTarget.style.color = "#1e293b";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "#f1f5f9";
                              e.currentTarget.style.color = "#475569";
                            }
                          }}
                        >
                          📍 {city}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BACKGROUND (QUALIFICATION + EXPERIENCE) */}
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
                <GraduationCap size={22} />
              </div>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                Your background
              </h2>
              <p
                style={{
                  fontSize: "0.92rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "20px",
                }}
              >
                Tell us about your education and experience so we match you at the right level.
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
                    Highest Qualification
                  </label>
                  <CustomSelect
                    options={QUALIFICATION_OPTIONS}
                    value={highestQualification}
                    onChange={(e) => setHighestQualification(e.target.value)}
                    placeholder="Select Degree"
                  />
                </div>

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
                    Experience Level
                  </label>
                  <CustomSelect
                    options={EXPERIENCE_OPTIONS}
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    placeholder="Select Experience Level"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SKILLS */}
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
                What are your top skills?
              </h2>
              <p
                style={{
                  fontSize: "0.92rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "12px",
                }}
              >
                Add at least <strong>3 to 5 skills</strong>. We use your skills to match you directly against active job requirements.
              </p>

              {/* SKILLS COUNTER BADGE */}
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
                    ? `✓ Great! ${skills.length} skills added (3–5 recommended)`
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
                    name="onboarding_skill_search"
                    id="onboarding_skill_search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    value={skillInput}
                    onChange={(e) => handleSkillInputChange(e.target.value)}
                    placeholder="Type a skill (e.g. React, Node.js, Python)..."
                    autoFocus
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
                      fontSize: "0.95rem",
                      color: "#1e293b",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#cbd5e1";
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
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* AUTOCOMPLETE SUGGESTIONS POPUP */}
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
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        style={{
                          padding: "10px 14px",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          backgroundColor:
                            idx === activeSuggestionIndex ? "#eff6ff" : "#ffffff",
                          color: idx === activeSuggestionIndex ? "#2563eb" : "#1e293b",
                          fontWeight: idx === activeSuggestionIndex ? 600 : 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom:
                            idx !== suggestions.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
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
                  minHeight: "75px",
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
                    No skills added yet. Add at least 3 skills above or tap the suggestions below!
                  </span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        fontSize: "0.85rem",
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
                        title="Remove skill"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* QUICK POPULAR SKILL PILLS */}
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
                  Popular skills (tap to quickly add):
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {POPULAR_SUGGESTED_SKILLS.filter(
                    (s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
                  ).slice(0, 10).map((pill) => (
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
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e0e7ff";
                        e.currentTarget.style.borderColor = "#c7d2fe";
                        e.currentTarget.style.color = "#3730a3";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.color = "#334155";
                      }}
                    >
                      + {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DONE CONFIRMATION */}
          {step === 4 && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                You're all set! 🚀
              </h2>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#64748b",
                  lineHeight: "1.5",
                  marginBottom: "24px",
                  maxWidth: "380px",
                  margin: "0 auto 24px",
                }}
              >
                We'll start showing you jobs that match your profile. You can always refine these details in your profile settings.
              </p>

              {/* SUMMARY CARD */}
              <div
                style={{
                  textAlign: "left",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "16px 20px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                  Profile Snapshot
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.88rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Location: </span>
                    <strong style={{ color: "#1e293b" }}>{location || "Not specified"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Degree: </span>
                    <strong style={{ color: "#1e293b" }}>{highestQualification || "Not specified"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Experience: </span>
                    <strong style={{ color: "#1e293b" }}>{experienceLevel}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Skills: </span>
                    <strong style={{ color: "#2563eb" }}>{skills.length} added</strong>
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
          {/* BACK BUTTON */}
          <div>
            {step > 1 && step < 4 && (
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

          {/* NEXT / DONE / SKIP BUTTONS */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* SKIP FOR NOW (STEPS 2 & 3) */}
            {(step === 2 || step === 3) && (
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
                  padding: "6px 8px",
                }}
              >
                Skip for now
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 3 && skills.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  background: step === 3 && skills.length === 0 ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: step === 3 && skills.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                  transition: "background-color 0.2s ease",
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
                  width: "100%",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Setting up your feed...
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
