import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import BackButton from "../../Components/BackButton";
import "../../Styles/pages/recruiter/recruiterProfile.css";
import { changePassword, updateProfile } from "../../Services/jobService";

function RecruiterProfile() {
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

  // 2. Input Fields State — recruiter-specific
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [designation, setDesignation] = useState(user?.designation || "");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [companyWebsite, setCompanyWebsite] = useState(user?.companyWebsite || "");
  const [about, setAbout] = useState(user?.about || "");

  // 3. File Uploads State
  const [profileImage, setProfileImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Profile Completion Calculation Matrix — recruiter-specific fields
  // (no resume/education/experience/skills — those belong to candidates only)
  const calculateCompletion = (profileUser) => {
    const fields = [
      profileUser?.name,
      profileUser?.email,
      profileUser?.phone,
      profileUser?.location,
      profileUser?.linkedin,
      profileUser?.designation,
      profileUser?.companyName,
      profileUser?.companyWebsite,
      profileUser?.about,
      profileUser?.profileImage,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  // State Synchronization Block
  useEffect(() => {
    if (user) {
      setSavedCompletion(calculateCompletion(user));
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setLocation(user.location || "");
      setLinkedin(user.linkedin || "");
      setDesignation(user.designation || "");
      setCompanyName(user.companyName || "");
      setCompanyWebsite(user.companyWebsite || "");
      setAbout(user.about || "");
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
      formData.append("designation", designation);
      formData.append("companyName", companyName);
      formData.append("companyWebsite", companyWebsite);
      formData.append("about", about);

      if (profileImage) formData.append("profileImage", profileImage);

      const response = await updateProfile(formData);

      toast.success(response.message || "Profile updated successfully!");

      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);

      setProfileImage(null);
    } catch (error) {
      console.error("Update Error:", error);
      toast.error(error?.response?.data?.message || "Update failed");
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

  return (
    <div className="profile-page">
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        <BackButton />
      </div>
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
          <span className="role-badge">{user?.role || "Recruiter"}</span>

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
                <p>Jobs Posted</p>
                <h3>{user?.jobsPosted?.length || 0}</h3>
              </div>
              <div className="stat-card">
                <p>Applicants</p>
                <h3>{user?.totalApplicants || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN FORM WORKSPACE */}
        <div className="profile-content">

          <div className="profile-content-header">
            <span className="profile-eyebrow">Recruiter profile</span>
            <h1>My Profile</h1>
            <p className="profile-content-subtitle">
              Candidates see this before they apply — make your company look its best.
            </p>
          </div>

          {/* Basic Information */}
          <div className="profile-section-card">
            <h2 className="profile-section-title">Basic information</h2>

            <div className="profile-grid">
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Email</label>
                <input type="email" value={email} disabled />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input type="text" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Location</label>
                <input type="text" placeholder="Jaipur, India" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Designation</label>
                <input type="text" placeholder="e.g. Talent Acquisition Manager" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </div>

              <div className="input-group">
                <label>LinkedIn</label>
                <input type="text" placeholder="linkedin.com/in/yourname" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="profile-section-card">
            <h2 className="profile-section-title">Company information</h2>

            <div className="profile-grid">
              <div className="input-group">
                <label>Company Name</label>
                <input type="text" placeholder="e.g. SkillBridge Technologies" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Company Website</label>
                <input type="text" placeholder="https://yourcompany.com" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} />
              </div>
            </div>
          </div>

          {/* About the Company */}
          <div className="profile-section-card">
            <div className="input-group">
              <label>About the company</label>
              <textarea
                rows={5}
                placeholder="Tell candidates what your company does and what it's like to work there..."
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="company-about-textarea"
              />
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

export default RecruiterProfile;