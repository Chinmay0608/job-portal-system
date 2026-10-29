import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Building2, CalendarDays, Check, Circle, Clock3, ImagePlus, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import CustomSelect from "../../Components/CustomSelect";
import { changePassword, getUserProfile, updateProfile } from "../../Services/jobService";
import { getApiBaseUrl } from "../../Services/authUtils";

const INDUSTRIES = ["Software / SaaS", "FinTech", "EdTech", "Healthcare", "E-Commerce", "Other"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const TIME_ZONES = typeof Intl.supportedValuesOf === "function"
  ? ["UTC", ...Intl.supportedValuesOf("timeZone")]
  : ["Asia/Kolkata", "UTC", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago", "America/Los_Angeles", "Australia/Sydney"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BASE_PROFILE = {
  name: "", email: "", phone: "", location: "", linkedin: "", designation: "", companyName: "", companyWebsite: "", about: "",
  profileImage: "", companyLogo: "", companyIndustry: "", companySize: "", companyHeadquarters: "",
  companySocials: { linkedin: "", twitter: "", github: "" }, timeZone: "Asia/Kolkata", schedulingLink: "", emailSignature: "", contactVisibility: false, isVerified: false,
};

const profileFromUser = (user = {}) => ({
  ...BASE_PROFILE,
  ...user,
  companySocials: { ...BASE_PROFILE.companySocials, ...(user.companySocials || {}) },
});

const completionFields = [
  ["name", 8], ["email", 5], ["phone", 4], ["location", 4], ["designation", 4],
  ["companyName", 7], ["companyWebsite", 5], ["companyLogo", 15], ["companyIndustry", 10],
  ["companySize", 5], ["companyHeadquarters", 5], ["about", 5], ["linkedin", 3],
  ["socialLinkedin", 3], ["socialTwitter", 2], ["socialGithub", 2], ["timeZone", 2],
  ["schedulingLink", 10], ["emailSignature", 1],
];

const normalizeUrl = (value, label) => {
  const text = String(value || "").trim();
  if (!text) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }
};

function RecruiterProfile() {
  const API_URL = getApiBaseUrl();
  const [profile, setProfile] = useState(() => {
    try { return profileFromUser(JSON.parse(localStorage.getItem("user") || "{}")); }
    catch { return profileFromUser(); }
  });
  const [activeTab, setActiveTab] = useState("public");
  const [logoFile, setLogoFile] = useState(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [profilePreview, setProfilePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    let active = true;
    getUserProfile().then(({ user }) => {
      if (!active || !user) return;
      setProfile(profileFromUser(user));
      localStorage.setItem("user", JSON.stringify(user));
    }).catch((error) => console.error("Could not load recruiter profile:", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!logoFile) { setLogoPreview(""); return undefined; }
    const preview = URL.createObjectURL(logoFile);
    setLogoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [logoFile]);

  useEffect(() => {
    if (!profileImageFile) { setProfilePreview(""); return undefined; }
    const preview = URL.createObjectURL(profileImageFile);
    setProfilePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [profileImageFile]);

  const completion = useMemo(() => {
    const values = {
      ...profile,
      companyLogo: logoFile ? "selected" : profile.companyLogo,
      socialLinkedin: profile.companySocials.linkedin,
      socialTwitter: profile.companySocials.twitter,
      socialGithub: profile.companySocials.github,
    };
    return completionFields.reduce((total, [key, weight]) => total + (String(values[key] || "").trim() ? weight : 0), 0);
  }, [profile, logoFile]);

  const missingMilestones = [
    { key: "companyLogo", label: "Add company logo", gain: 15, tab: "public" },
    { key: "companyIndustry", label: "Select industry", gain: 10, tab: "public" },
    { key: "schedulingLink", label: "Add scheduling link", gain: 10, tab: "preferences" },
    { key: "companyWebsite", label: "Add company website", gain: 5, tab: "public" },
  ].filter(({ key }) => !profile[key] && !(key === "companyLogo" && logoFile));

  const updateField = (name, value) => setProfile((current) => ({ ...current, [name]: value }));
  const updateSocial = (name, value) => setProfile((current) => ({
    ...current,
    companySocials: { ...current.companySocials, [name]: value },
  }));

  const handleImage = (file, setter, label) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error(`${label} must be a JPG, PNG, or WebP image`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} must be smaller than 5 MB`);
      return;
    }
    setter(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const requiredFields = [
      ["Full name", profile.name],
      ["Account email", profile.email],
      ["Location", profile.location],
      ["Job title", profile.designation],
      ["LinkedIn profile", profile.linkedin],
    ];
    const missingField = requiredFields.find(([, value]) => !String(value || "").trim());
    if (missingField) {
      toast.error(`${missingField[0]} is required`);
      return;
    }

    let normalized;
    try {
      normalized = {
        ...profile,
        companyWebsite: normalizeUrl(profile.companyWebsite, "Company website"),
        linkedin: normalizeUrl(profile.linkedin, "LinkedIn"),
        schedulingLink: normalizeUrl(profile.schedulingLink, "Scheduling link"),
        companySocials: {
          linkedin: normalizeUrl(profile.companySocials.linkedin, "Company LinkedIn"),
          twitter: normalizeUrl(profile.companySocials.twitter, "Company X / Twitter"),
          github: normalizeUrl(profile.companySocials.github, "Company GitHub"),
        },
      };
    } catch (error) {
      toast.error(error.message);
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      ["name", "phone", "location", "linkedin", "designation", "companyName", "companyWebsite", "about", "companyIndustry", "companySize", "companyHeadquarters", "timeZone", "schedulingLink", "emailSignature"].forEach((key) => {
        formData.append(key, normalized[key] || "");
      });
      formData.append("companySocials", JSON.stringify(normalized.companySocials));
      formData.append("contactVisibility", String(profile.contactVisibility));
      formData.append("removeCompanyLogo", String(logoRemoved));
      if (logoFile) formData.append("companyLogo", logoFile);
      if (profileImageFile) formData.append("profileImage", profileImageFile);

      const response = await updateProfile(formData);
      const nextProfile = profileFromUser(response.user);
      setProfile(nextProfile);
      localStorage.setItem("user", JSON.stringify(response.user));
      setLogoFile(null);
      setLogoRemoved(false);
      setProfileImageFile(null);
      toast.success(response.message || "Recruiter profile saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save your profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (!passwords.current || !passwords.next || !passwords.confirm) return toast.error("Please fill in all password fields.");
    if (passwords.next !== passwords.confirm) return toast.error("New passwords do not match.");
    try {
      setPasswordSaving(true);
      const response = await changePassword({ currentPassword: passwords.current, newPassword: passwords.next, confirmNewPassword: passwords.confirm });
      toast.success(response.message || "Password updated successfully");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Password update failed");
    } finally {
      setPasswordSaving(false);
    }
  };

  const imageUrl = (path) => path?.startsWith("http") ? path : path ? `${API_URL}/${path.replace(/^\/+/, "")}` : "";
  const tabs = [
    { id: "public", label: "Public Profile & Company", icon: Building2 },
    { id: "preferences", label: "Hiring Preferences", icon: CalendarDays },
    { id: "security", label: "Account Security", icon: LockKeyhole },
  ];

  const textField = (label, key, options = {}) => (
    <label className="rp-field" key={key}>
      <span>{label}{options.required && <b className="rp-required"> *</b>}</span>
      <input
        type={options.type || "text"}
        value={profile[key] || ""}
        placeholder={options.placeholder || ""}
        readOnly={options.readOnly}
        required={options.required}
        onChange={(event) => updateField(key, event.target.value)}
        autoComplete={options.autoComplete}
      />
    </label>
  );

  return (
    <div className="recruiter-profile-page">
      <div className="rp-layout">
        <aside className="rp-sidebar">
          <div className="rp-identity">
            <label className="rp-avatar-upload" title="Upload profile photo">
              {(profilePreview || imageUrl(profile.profileImage))
                ? <img src={profilePreview || imageUrl(profile.profileImage)} alt="Recruiter profile" />
                : <span>{profile.name?.charAt(0)?.toUpperCase() || <UserRound size={26} />}</span>}
              <input type="file" accept="image/*" onChange={(event) => handleImage(event.target.files?.[0], setProfileImageFile, "Profile image")} />
              <ImagePlus size={15} />
            </label>
            <h1>{profile.name || "Your profile"}</h1>
            <p>{profile.email}</p>
            <span className="rp-role-badge">Recruiter</span>
            {profile.isVerified && <span className="rp-verified"><ShieldCheck size={14} /> Verified company</span>}
          </div>

          <section className="rp-strength" aria-label="Profile strength">
            <div className="rp-strength-heading"><span>Profile strength</span><strong>{completion}%</strong></div>
            <div className="rp-progress"><span style={{ width: `${completion}%` }} /></div>
            <p className="rp-checklist-title">Next steps</p>
            {missingMilestones.length ? (
              <ul className="rp-checklist">
                {missingMilestones.map((item) => (
                  <li key={item.key}>
                    <button type="button" onClick={() => setActiveTab(item.tab)}>
                      <Circle size={14} /><span>{item.label}</span><strong>+{item.gain}%</strong>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="rp-complete"><Check size={15} /> Profile milestones complete</p>}
          </section>
        </aside>

        <main className="rp-main">
          <header className="rp-page-heading">
            <div><span>RECRUITER WORKSPACE</span><h2>Recruiter profile</h2><p>Show candidates who you are and how your team hires.</p></div>
          </header>

          <div className="rp-tabs" role="tablist" aria-label="Recruiter profile sections">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} id={`rp-tab-${id}`} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`rp-panel-${id}`} className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)}>
                <Icon size={17} /><span>{label}</span>
              </button>
            ))}
          </div>

          {activeTab === "public" && (
            <form className="rp-panel" id="rp-panel-public" role="tabpanel" aria-labelledby="rp-tab-public" onSubmit={handleSave} noValidate>
              <section className="rp-card">
                <div className="rp-section-heading"><div><h3>Personal information</h3><p>Keep your recruiter contact details current.</p></div></div>
                <div className="rp-fields">
                  {textField("Full name", "name", { autoComplete: "name", required: true })}
                  {textField("Account email", "email", { type: "email", readOnly: true, autoComplete: "email", required: true })}
                  {textField("Phone number", "phone", { type: "tel", placeholder: "+91 98765 43210", autoComplete: "tel" })}
                  {textField("Location", "location", { placeholder: "Bengaluru, India", autoComplete: "address-level2", required: true })}
                  {textField("Job title", "designation", { placeholder: "Talent Acquisition Manager", autoComplete: "organization-title", required: true })}
                  {textField("LinkedIn profile", "linkedin", { type: "url", placeholder: "https://linkedin.com/in/yourname", required: true })}
                </div>
              </section>

              <section className="rp-card">
                <div className="rp-section-heading"><div><h3>Company information</h3><p>Build a trustworthy public presence for applicants.</p></div></div>
                <div className="rp-company-grid">
                  <div className="rp-company-fields">
                    <div className="rp-fields">
                      {textField("Company name", "companyName", { autoComplete: "organization" })}
                      {textField("Company website", "companyWebsite", { type: "url", placeholder: "https://company.com" })}
                      <label className="rp-field"><span>Industry</span><CustomSelect className="w-full min-w-0" name="companyIndustry" value={profile.companyIndustry} onChange={(event) => updateField("companyIndustry", event.target.value)} options={INDUSTRIES.map((industry) => ({ value: industry, label: industry }))} placeholder="Select industry" aria-label="Industry" maxMenuHeight={180} compact /></label>
                      <label className="rp-field"><span>Company size</span><CustomSelect className="w-full min-w-0" name="companySize" value={profile.companySize} onChange={(event) => updateField("companySize", event.target.value)} options={COMPANY_SIZES.map((size) => ({ value: size, label: size }))} placeholder="Select company size" aria-label="Company size" maxMenuHeight={180} compact /></label>
                      {textField("Headquarters", "companyHeadquarters", { placeholder: "Bengaluru, India" })}
                    </div>
                    <label className="rp-field rp-full-field"><span>About the company</span><textarea rows={4} value={profile.about} onChange={(event) => updateField("about", event.target.value)} placeholder="Tell candidates what your company does and what it is like to work there." /></label>
                  </div>
                  <div className="rp-logo-field">
                    <span className="rp-label">Company logo</span>
                    <label className="rp-logo-drop">
                      {logoPreview || imageUrl(profile.companyLogo)
                        ? <img src={logoPreview || imageUrl(profile.companyLogo)} alt="Company logo preview" />
                        : <><ImagePlus size={25} /><strong>Upload a logo</strong><small>PNG, JPG, or WebP · Max 5 MB</small></>}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleImage(event.target.files?.[0], (file) => { setLogoFile(file); setLogoRemoved(false); }, "Company logo")} />
                    </label>
                    {(logoPreview || profile.companyLogo) && <button type="button" className="rp-text-button" onClick={() => { setLogoFile(null); setLogoRemoved(true); updateField("companyLogo", ""); }}>Remove logo</button>}
                  </div>
                </div>
                <div className="rp-fields rp-social-fields">
                  {["linkedin", "twitter", "github"].map((network) => (
                    <label className="rp-field" key={network}><span>Company {network === "twitter" ? "X / Twitter" : network[0].toUpperCase() + network.slice(1)}</span><input type="url" value={profile.companySocials[network]} placeholder={`https://${network === "twitter" ? "x" : network}.com/company`} onChange={(event) => updateSocial(network, event.target.value)} /></label>
                  ))}
                </div>
              </section>

              <div className="rp-save-row"><button type="submit" className="rp-primary-button" disabled={saving}>{saving ? "Saving profile…" : "Save profile"}</button></div>
            </form>
          )}

          {activeTab === "preferences" && (
            <form className="rp-panel" id="rp-panel-preferences" role="tabpanel" aria-labelledby="rp-tab-preferences" onSubmit={handleSave} noValidate>
              <section className="rp-card">
                <div className="rp-section-heading"><div><h3>Hiring preferences</h3><p>Set how candidates can schedule and contact your team.</p></div><Clock3 size={20} /></div>
                <div className="rp-fields">
                  <label className="rp-field"><span>Time zone</span><select value={profile.timeZone} onChange={(event) => updateField("timeZone", event.target.value)}>{TIME_ZONES.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
                  {textField("Interview booking link", "schedulingLink", { type: "url", placeholder: "https://calendly.com/yourname" })}
                  <label className="rp-field rp-full-field"><span>Email signature</span><textarea rows={4} maxLength={1000} value={profile.emailSignature || ""} onChange={(event) => updateField("emailSignature", event.target.value)} placeholder="Your name · Talent Acquisition · Company" /><small>{(profile.emailSignature || "").length}/1000 characters</small></label>
                </div>
                <label className="rp-visibility-toggle"><span><strong>Show direct contact details</strong><small>Allow applicants to see your email and phone on your public profile.</small></span><input type="checkbox" checked={profile.contactVisibility} onChange={(event) => updateField("contactVisibility", event.target.checked)} /><i /></label>
              </section>
              <div className="rp-save-row"><button type="submit" className="rp-primary-button" disabled={saving}>{saving ? "Saving preferences…" : "Save preferences"}</button></div>
            </form>
          )}

          {activeTab === "security" && (
            <section className="rp-panel" id="rp-panel-security" role="tabpanel" aria-labelledby="rp-tab-security">
              <form className="rp-card" onSubmit={handleChangePassword} autoComplete="off">
                <div className="rp-section-heading"><div><h3>Change password</h3><p>Use a strong password you do not use elsewhere.</p></div><ShieldCheck size={20} /></div>
                <input type="text" name="username" autoComplete="username" value={profile.email} readOnly hidden />
                <div className="rp-fields">
                  <label className="rp-field"><span>Current password</span><input type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} /></label>
                  <label className="rp-field"><span>New password</span><input type="password" autoComplete="new-password" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} /></label>
                  <label className="rp-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} /></label>
                </div>
                <div className="rp-save-row"><button type="submit" className="rp-primary-button" disabled={passwordSaving}>{passwordSaving ? "Updating password…" : "Update password"}</button></div>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default RecruiterProfile;
