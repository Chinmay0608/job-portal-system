import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import debounce from "lodash.debounce";
import BackButton from "../../Components/BackButton";
import CustomSelect from "../../Components/CustomSelect";
import "../../Styles/pages/candidate/candidateProfile.css";
import { changePassword, updateProfile, extractSkillsAPI, getUserProfile } from "../../Services/jobService";

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

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Dynamic User Saved Skills
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [skillError, setSkillError] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // 3. File Uploads State
  const [profileImage, setProfileImage] = useState(null);
  const [resume, setResume] = useState(null);

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

  // Mount effect: Fetch fresh user profile from backend
  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const res = await getUserProfile();
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        }
      } catch (err) {
        console.error("Failed to fetch fresh profile:", err);
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
      setSkills(user.skills || []);
      setEducation(user.education || "");
      setExperienceLevel(user.experienceLevel || "Fresher");
      setField(user.field || "Software Engineering");
    }
  }, [user]);

  /* Safe Resume URL Fix */
  const getResumeUrl = (resumePath) => {
    if (!resumePath) return "#";
    if (resumePath.startsWith("http")) return resumePath;
    return `${API_URL}/${resumePath.replace(/^\/+/, "")}`;
  };

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

  const handleDownloadResume = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = getResumeUrl(user.resume);
      const response = await fetch(url);
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
    const trimmed = skillName.trim();
    
    // Validate: skill name must not be empty
    if (!trimmed) {
      setSkillError("");
      return;
    }

    // Validate: check if skill already exists in user's skills array
    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput("");
      setSuggestions([]);
      return;
    }

    // STRICT SUGGESTION CHECK: Find case-insensitive match in suggestions array
    const matchedSkill = suggestions.find(
      (suggestion) => suggestion.toLowerCase() === trimmed.toLowerCase()
    );

    // If matched suggestion found, add the correctly-cased version
    if (matchedSkill) {
      setSkills((prevSkills) => [...prevSkills, matchedSkill]);
      setSkillInput("");
      setSuggestions([]);
      setSkillError("");
    } else {
      // No match found in suggestions — block addition and show error
      setSkillError("Please select a valid technical skill from the suggestion dropdown menu.");
    }
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

  // Async function to fetch skills from backend API
  const fetchSkillSuggestions = async (query) => {
    try {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/jobs/skills/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        console.error("Failed to fetch skills:", response.statusText);
        setSuggestions([]);
        return;
      }

      const data = await response.json();
      
      // Filter out already-added skills
      const filtered = data.filter(
        (skill) => !skills.some(s => s.toLowerCase() === skill.toLowerCase())
      );

      setSuggestions(filtered.slice(0, 8));
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
      setSuggestions([]);
    }
  };

  // Debounced skill search function
  const debouncedSkillSearch = useCallback(
    debounce((query) => {
      fetchSkillSuggestions(query);
    }, 250),
    [skills]
  );

  const handleSkillInputChange = (value) => {
    setActiveSuggestionIndex(-1);
    setSkillInput(value);

    // Only trigger API call if input has content
    if (value.trim().length > 0) {
      setSkillError("");
      debouncedSkillSearch(value);
    } else {
      // Clear suggestions and error when input is empty
      setSuggestions([]);
      setSkillError("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* LEFT COLUMN: SIDEBAR */}
        <div className="profile-sidebar">

          <div className="avatar-wrapper">
            {user?.profileImage ? (
              <img
                src={user.profileImage.startsWith("http") ? user.profileImage : `${API_URL}/${user.profileImage.replace(/^\/+/, "")}`}
                alt="profile"
                className="profile-avatar"
              />
            ) : (
              <div className="avatar-circle">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}

            <label className="upload-avatar-btn">
              📷
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setProfileImage(e.target.files[0])}
              />
            </label>
          </div>

          <h2>{user?.name || "Guest User"}</h2>
          <p>{user?.email}</p>
          <span className="role-badge">{user?.role || "Candidate"}</span>

          <div className="completion-section">
            <div className="completion-header">
              <p>Profile strength</p>
              <span className="completion-percent">{savedCompletion}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${savedCompletion}%` }}
              />
            </div>

            <div className="profile-stats">
              <div className="stat-card">
                <p>Applications</p>
                <h3>{user?.applications?.length || 0}</h3>
              </div>
              <div className="stat-card">
                <p>Saved Jobs</p>
                <h3>0</h3>
              </div>
            </div>
          </div>

          <div className="resume-box">
            <h3>Resume</h3>
            {user?.resume && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <a
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(getResumeUrl(user.resume))}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#f3f4f6', borderRadius: '6px', color: '#111827', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}
                >
                  👁️ Preview
                </a>
                <a
                  href="#"
                  onClick={handleDownloadResume}
                  style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#0d1117', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  ⬇️ Download
                </a>
              </div>
            )}
            <label className="resume-upload-label">
              {user?.resume ? "Upload replacement file" : "Upload new file"}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files[0])}
              />
            </label>
            {resume ? (
              <p style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "4px" }}>
                Selected: {resume.name}. Click "Save Changes" to apply.
              </p>
            ) : (
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                Don't forget to click "Save Changes" at the bottom!
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN FORM WORKSPACE */}
        <div className="profile-content">

          <div className="profile-content-header">
            <span className="profile-eyebrow">Candidate profile</span>
            <h1>My Profile</h1>
            <p className="profile-content-subtitle">
              Keep this up to date — recruiters see this before they see your resume.
            </p>
          </div>

          {/* Clean Input Grid Layout Block */}
          <div className="profile-section-card">
            <h2 className="profile-section-title">Basic information</h2>

            <div className="profile-grid">
              {/* Field 1: Full Name */}
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* Field 2: Email */}
              <div className="input-group">
                <label>Email</label>
                <input type="email" value={email} disabled />
              </div>

              {/* Field 3: Phone */}
              <div className="input-group">
                <label>Phone Number</label>
                <input type="text" placeholder="e.g., +91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {/* Field 4: Location */}
              <div className="input-group">
                <label>Location</label>
                <input type="text" placeholder="e.g., Jaipur, India" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              {/* Dropdown 1: Select Degree Group */}
              <div className="input-group">
                <label>Highest Qualification</label>
                <CustomSelect
                  options={[{ value: "", label: "Select Degree" }, { value: "B.Tech", label: "B.Tech" }, { value: "M.Tech", label: "M.Tech" }, { value: "BCA", label: "BCA" }, { value: "MCA", label: "MCA" }]}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>

              {/* Dropdown 2: Experience Level Group */}
              <div className="input-group">
                <label>Experience Level</label>
                <CustomSelect
                  options={[{ value: "Fresher", label: "Fresher" }, { value: "0-2 Years", label: "0-2 Years" }, { value: "2-5 Years", label: "2-5 Years" }, { value: "5+ Years", label: "5+ Years" }]}
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                />
              </div>

              {/* Dropdown 3: Domain / Field of Work */}
              <div className="input-group">
                <label>Domain / Field of Work</label>
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
                />
              </div>

              {/* Field 5: LinkedIn */}
              <div className="input-group">
                <label>LinkedIn</label>
                <input type="text" placeholder="e.g., linkedin.com/in/yourname" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>

              {/* Field 6: GitHub */}
              <div className="input-group">
                <label>GitHub</label>
                <input type="text" placeholder="e.g., github.com/yourname" value={github} onChange={(e) => setGithub(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Skills Engine Block */}
          <div className="profile-section-card">
            <div className="skills-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Skills</h3>
                {user?.resume && (
                  <button 
                    type="button"
                    onClick={handleExtractSkills}
                    disabled={loading}
                    style={{
                      background: "#2563eb", color: "white", border: "none", 
                      padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", 
                      fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    ✨ Extract from Resume
                  </button>
                )}
              </div>
              <div className="skill-input-box" style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={(e) => handleSkillInputChange(e.target.value)}
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
                      }
                    }}
                />
                <button type="button" className="add-skill-btn" onClick={() => handleAddSkill(skillInput)}>
                  Add
                </button>

                {suggestions.length > 0 && (
                  <div
                    className="skill-suggestions"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderTop: "none",
                      maxHeight: "200px",
                      overflowY: "auto",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                    }}
                  >
                    {suggestions.map((suggestion, index) => (
                        <button
                          type="button"
                          key={suggestion}
                          className="skill-suggestion-item"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            border: "none",
                            backgroundColor: index === activeSuggestionIndex ? "#f0f0f0" : "transparent",
                            cursor: "pointer",
                            display: "block",
                            fontSize: "14px",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          onMouseLeave={() => setActiveSuggestionIndex(-1)}
                          onClick={() => {
                            handleAddSkill(suggestion);
                            setActiveSuggestionIndex(-1);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {skillError && <p className="skill-error">{skillError}</p>}

              <div className="skills-tags">
                {skills.length === 0 && (
                  <span className="skills-empty">No skills added yet — add your first one above.</span>
                )}
                {skills.map((skill, index) => (
                  <span key={index} className="skill-chip">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-section-card password-card">
            <h2 className="profile-section-title">Change password</h2>
            <div className="profile-grid">
              <div className="input-group">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="profile-save-bar">
              <button type="button" className="update-password-btn" onClick={handleChangePassword} disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Action Trigger Base */}
          <div className="profile-save-bar">
            <button type="button" className="save-btn" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CandidateProfile;