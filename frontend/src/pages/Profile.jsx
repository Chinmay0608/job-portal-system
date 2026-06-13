import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./Profile.css";
import { updateProfile } from "../Services/jobService";

function Profile() {
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  /* Safe User Parse */
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("User Parse Error:", error);
  }

  const [user, setUser] = useState(storedUser);
  const [profileImage,setProfileImage] = useState(null);
  const [name, setName] = useState(storedUser?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState(["React","Node.js","MongoDB"]);
  const [skillInput, setSkillInput] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [github, setGithub] = useState(user?.github || "");
  const [about, setAbout] = useState(user?.about || "");
  const [savedCompletion,setSavedCompletion] = useState(0);

  const calculateCompletion =
  (profileUser) => {
    const fields = [
      profileUser?.name,
      profileUser?.email,
      profileUser?.phone,
      profileUser?.location,
      profileUser?.linkedin,
      profileUser?.github,
      profileUser?.about,
      profileUser?.skills
        ?.length > 0,
      profileUser?.resume,
      profileUser
        ?.profileImage,
    ];

    const completed =
      fields.filter(Boolean)
        .length;

    return Math.round(
      (completed /
        fields.length) *
        100
    );
  };

  useEffect(() => {
    if (user) {
      setSavedCompletion(
        calculateCompletion(
          user
        )
      );
    }
  }, [user]);

  /* Resume URL Fix */
  const getResumeUrl = (resumePath) => {
    if (!resumePath) return "#";
    if (resumePath.startsWith("http")) return resumePath;
    return `${API_URL}/${resumePath.replace(/^\/+/, "")}`;
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const formData =
        new FormData();

      formData.append(
        "name",
        name
      );

      formData.append(
        "phone",
        phone
      );

      formData.append(
        "location",
        location
      );

      formData.append(
        "linkedin",
        linkedin
      );

      formData.append(
        "github",
        github
      );

      formData.append(
        "about",
        about
      );

      formData.append(
        "skills",
        JSON.stringify(
          skills
        )
      );

      /* Resume Upload */
      if (resume) {
        formData.append(
          "resume",
          resume
        );
      }

      /* Profile Image Upload */
      if (profileImage) {
        formData.append(
          "profileImage",
          profileImage
        );
      }

      const response =
        await updateProfile(
          formData
        );

      toast.success(
        response.message ||
          "Profile updated"
      );

      /* Update Local User */
      localStorage.setItem(
        "user",
        JSON.stringify(
          response.user
        )
      );

      setUser(
        response.user
      );

      /* Clear temp uploads */
      setResume(null);
      setProfileImage(null);
      
    } catch (error) {
      console.error(
        "Update Error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();

    if (
      trimmed &&
      !skills.includes(trimmed)
    ) {
      setSkills([
        ...skills,
        trimmed
      ]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setSkills(
      skills.filter(
        (s) => s !== skill
      )
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* LEFT SIDEBAR */}
        <div className="profile-sidebar">
          <div className="avatar-wrapper">
            {user?.profileImage ? (
              <img
                src={
                  user?.profileImage
                }
                alt="profile"
                className="profile-avatar"
              />
            ) : (
              <div className="avatar-circle">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <label className="upload-avatar-btn">
              📷
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  setProfileImage(
                    e.target.files[0]
                  )
                }
              />
            </label>
          </div>

          <h2>{user?.name}</h2>
          <p>{user?.email}</p>

          <span className="role-badge">
            {user?.role}
          </span>

          <div className="completion-section">
            <p>Profile Completion</p> 
            <span className="completion-percent">
              {savedCompletion}% Complete
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${savedCompletion}%`,
                }}
              />
            </div>

            <div className="profile-stats">
              
              <div className="stat-card">
                <h3>
                  {user?.applications?.length || 0}
                </h3>
                <p>Applications</p>
              </div>

              <div className="stat-card">
                <h3>0</h3>
                <p>Saved Jobs</p>
              </div>
            </div>
          </div>

          {/* Resume */}
          <div className="resume-box">
            <h3>Resume</h3>

            {/* Current Resume */}
            {user?.resume && (
              <a
                href={getResumeUrl(
                  user.resume
                )}
                target="_blank"
                rel="noreferrer"
                className="resume-link"
              >
                📄 View Current Resume
              </a>
            )}

            {/* Upload New Resume */}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                setResume(
                  e.target.files[0]
                )
              }
            />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="profile-content">
          <h1>My Profile</h1>

          <div className="profile-grid">
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
              />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="text"
                placeholder="Enter phone"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="Jaipur, India"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label>LinkedIn</label>
              <input
                type="text"
                placeholder="LinkedIn URL"
                value={linkedin}
                onChange={(e) =>
                  setLinkedin(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label>GitHub</label>
              <input
                type="text"
                placeholder="GitHub URL"
                value={github}
                onChange={(e) =>
                  setGithub(e.target.value)
                }
              />
            </div>
          </div>

          {/* ABOUT */}
          <div className="about-section">
            <label>About Me</label>

            <textarea
              rows="5"
              placeholder="Tell recruiters about yourself..."
              value={about}
              onChange={(e) =>
                setAbout(e.target.value)
              }
            />
          </div>

          {/* SKILLS */}
          <div className="skills-section">
            <h3>Skills</h3>

            <div className="skill-input-box">
              <input
                type="text"
                placeholder="Add skill..."
                value={skillInput}
                onChange={(e) =>
                  setSkillInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />

              <button
                className="add-skill-btn"
                onClick={addSkill}
              >
                Add
              </button>
            </div>

            <div className="skills-tags">
              {skills.map((skill, index) => (
                <span key={index}>
                  {skill}

                  <button
                    onClick={() =>
                      removeSkill(skill)
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button className="save-btn" onClick={handleSave}>
            {
              loading ? "Saving..." : "Save Profile"
            } 
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;