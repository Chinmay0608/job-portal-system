import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "../../Services/authService";
import { setStoredUser, getApiBaseUrl } from "../../Services/authUtils";
import { auth, provider } from "../../firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { getPasswordRequirements, isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../../utils/passwordPolicy";

const signupContent = {
  recruiter: {
    eyebrow: "Make your next move",
    headline: ["Build the team that", "moves you forward."],
    intro: "Share your opportunities, meet skilled people, and grow your team.",
    benefits: [
      { icon: "target", label: "Reach candidates suited to your roles" },
      { icon: "panel", label: "Review applicants in one place" },
      { icon: "team", label: "Build your team with confidence" },
    ],
    sample: { subtitle: "Applied today / 3 yrs experience", pill: "Shortlisted" },
    steps: [
      { title: "Set up your account", description: "Introduce your company to candidates.", icon: "building" },
      { title: "Post an opportunity", description: "Describe the role and skills you need.", icon: "pen" },
      { title: "Meet great candidates", description: "Review applicants and build your team.", icon: "check" },
    ],
  },
  candidate: {
    eyebrow: "Find your next role",
    headline: ["Find work that", "fits your skills."],
    intro: "Show what you can do, meet recruiters who are hiring, and take your next step.",
    benefits: [
      { icon: "target", label: "Get matched to roles that suit you" },
      { icon: "bolt", label: "Apply quickly and track every application" },
      { icon: "search", label: "Be seen by recruiters who are hiring" },
    ],
    sample: { subtitle: "Remote / Full-time", pill: "Good match" },
    steps: [
      { title: "Create your profile", description: "Add your skills and experience.", icon: "user" },
      { title: "Find opportunities", description: "Browse roles that match you.", icon: "search" },
      { title: "Get hired", description: "Apply and hear back from recruiters.", icon: "check" },
    ],
  },
};

const signupIconPaths = {
  target: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 11.2a.8.8 0 100 1.6.8.8 0 000-1.6z",
  panel: "M6.5 4h11A3 3 0 0120.5 7v10a3 3 0 01-3 3h-11a3 3 0 01-3-3V7a3 3 0 013-3zM3.5 9.5h17M9 9.5V20",
  team: "M9 5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 5.2a3.3 3.3 0 010 6.2M18.5 14.8c1.7.7 2.7 2.3 3 5.2",
  building: "M7 3.5h10a2 2 0 012 2v15H5v-15a2 2 0 012-2zM9 8h2M13 8h2M9 12h2M13 12h2M10 20.5v-4h4v4",
  pen: "M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1zM14.5 6.5l3 3",
  check: "M12 3a9 9 0 100 18 9 9 0 000-18zM8 12.3l2.7 2.7 5.3-5.5",
  user: "M12 4a4 4 0 100 8 4 4 0 000-8zM4.5 20c.7-4 3.6-6 7.5-6s6.8 2 7.5 6",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",
  bolt: "M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z",
};

const SignupIcon = ({ name, className = "" }) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={signupIconPaths[name]} />
  </svg>
);

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: location.state?.role || "recruiter",
  });
  const passwordRequirements = getPasswordRequirements(formData.password);
  const missingPasswordRequirements = passwordRequirements.filter(({ met }) => !met);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const redirectUser = (user) => {
    if (user?.role === "candidate") navigate("/candidate-dashboard");
    else navigate("/recruiter-dashboard");
  };

  useEffect(() => {
    let isCancelled = false;
    getRedirectResult(auth)
      .then(async (result) => {
        if (isCancelled || !result?.user) return;
        setGoogleLoading(true);
        const user = result.user;
        const idToken = await user.getIdToken();
        const pendingRole = sessionStorage.getItem("pending_google_role") || formData.role;
        sessionStorage.removeItem("pending_google_role");

        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/auth/google-login`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-requested-with": "XMLHttpRequest"
          },
          credentials: "include",
          body: JSON.stringify({ name: user.displayName, email: user.email, idToken, role: pendingRole }),
        });
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await response.json() : {};
        if (!response.ok) throw new Error(data.message || "Google Authentication Failed");
        setStoredUser(data.user, data.token);
        toast.success("Account initialized with Google successfully");
        redirectUser(data.user);
      })
      .catch((error) => {
        if (isCancelled) return;
        if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") return;
        console.error("Google Auth Redirect Error:", error);
        toast.error(error?.message || "Google Signup Failed");
      })
      .finally(() => {
        if (!isCancelled) setGoogleLoading(false);
      });

    return () => { isCancelled = true; };
  }, []);

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/google-login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ name: user.displayName, email: user.email, idToken, role: formData.role }),
      });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : {};
      if (!response.ok) throw new Error(data.message || "Google Authentication Failed");
      setStoredUser(data.user, data.token);
      toast.success("Account initialized with Google successfully");
      redirectUser(data.user);
    } catch (error) {
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        return;
      }
      if (error?.code === "auth/popup-blocked") {
        console.warn("Popup blocked by browser. Attempting redirect fallback...");
        toast.loading("Popup blocked by browser. Redirecting to Google Sign-In...", { id: "google-signup-toast", duration: 5000 });
        sessionStorage.setItem("pending_google_role", formData.role);
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error("Redirect fallback failed:", redirectError);
          toast.dismiss("google-signup-toast");
          toast.error("Pop-up blocked. Please click the pop-up icon in your address bar to allow pop-ups for this site.", { duration: 7000 });
          return;
        }
      }
      console.error("Google Auth Error:", error);
      let errMsg = error.message || "Google Signup Failed";
      if (error?.code === "auth/unauthorized-domain") {
        errMsg = "Domain not authorized in Firebase Console. Add your domain to Firebase Auth -> Settings -> Authorized Domains.";
      } else if (error?.code === "auth/invalid-api-key" || error?.code === "auth/configuration-not-found") {
        errMsg = "Firebase API Key missing. Set VITE_FIREBASE_* in Vercel environment variables.";
      }
      toast.error(errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();

    if (trimmedName.length < 3) return toast.error("Name must be at least 3 characters");
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) return toast.error("Name should contain only letters");
    if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) return toast.error("Enter a valid 10-digit phone number");
    if (!isStrongPassword(formData.password)) return toast.error(PASSWORD_POLICY_MESSAGE);

    try {
      setLoading(true);
      const formattedName = trimmedName.replace(/\s+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      const response = await registerUser({
        ...formData,
        name: formattedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      });

      toast.success(response.message || "Account created successfully");
      navigate("/login");
    } catch (error) {
      console.error("Registration Error:", error);
      const validationErrors = error?.response?.data?.errors;
      toast.error(error?.response?.data?.message || (Array.isArray(validationErrors) ? validationErrors[0] : null) || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-page">
      <div aria-hidden="true" className="signup-decoration signup-decoration-top" />
      <div aria-hidden="true" className="signup-decoration signup-decoration-bottom" />
      <div className="signup-layout">
        <aside className="signup-panel signup-left-panel">
          <div key={formData.role} className="signup-role-content">
            <p className="signup-eyebrow"><span />{signupContent[formData.role].eyebrow}</p>
            <h1 className="signup-headline">
              {signupContent[formData.role].headline[0]}{" "}
              <span className="signup-headline-accent">
                {signupContent[formData.role].headline[1]}
                <svg aria-hidden="true" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M2 6c30-5 60 3 96-1s60-3 100 0" />
                </svg>
              </span>
            </h1>
            <p className="signup-intro">{signupContent[formData.role].intro}</p>
            <div className="signup-benefits">
              {signupContent[formData.role].benefits.map(({ icon, label }) => (
                <div className="signup-benefit" key={label}>
                  <span className="signup-benefit-icon"><SignupIcon name={icon} /></span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="signup-sample-card" aria-hidden="true">
              <div className="signup-sample-top">
                <span className="signup-avatar">F</span>
                <div className="signup-sample-copy">
                  <strong>Frontend Developer</strong>
                  <span>{signupContent[formData.role].sample.subtitle}</span>
                </div>
                <span className="signup-match-pill">{signupContent[formData.role].sample.pill}</span>
              </div>
              <div className="signup-sample-chips"><span>React</span><span>Node.js</span><span>SQL</span></div>
            </div>
          </div>
        </aside>

        <section className="signup-card" aria-labelledby="signup-card-title">
          <h1 key={formData.role} className="signup-mobile-headline signup-role-content">
            {signupContent[formData.role].headline[0]}{" "}{signupContent[formData.role].headline[1]}
          </h1>
          <button type="button" className="signup-logo brand-wordmark" onClick={() => navigate("/")} aria-label="SkillBridge home">
            <span>Skill</span><span>Bridge</span>
          </button>
          <div className="signup-card-heading">
            <h2 id="signup-card-title">Create an Account</h2>
            <p>Start your journey with SkillBridge</p>
          </div>

          <div className="signup-role-toggle" role="group" aria-label="Choose account type">
            <button type="button" aria-pressed={formData.role === "candidate"} className={formData.role === "candidate" ? "is-active" : ""} onClick={() => setFormData(prev => ({ ...prev, role: "candidate" }))}>Candidate</button>
            <button type="button" aria-pressed={formData.role === "recruiter"} className={formData.role === "recruiter" ? "is-active" : ""} onClick={() => setFormData(prev => ({ ...prev, role: "recruiter" }))}>Recruiter</button>
          </div>

          <button type="button" className="signup-google" onClick={handleGoogleSignup} disabled={googleLoading}>
            <FcGoogle size={19} aria-hidden="true" />
            <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
          </button>

          <div className="signup-divider"><span>OR</span></div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="signup-field">
              <label htmlFor="signup-name">Full Name</label>
              <input id="signup-name" type="text" name="name" placeholder="e.g. Jane Doe" value={formData.name} onChange={handleChange} required autoComplete="name" />
            </div>
            <div className="signup-field">
              <label htmlFor="signup-email">Email Address</label>
              <input id="signup-email" type="email" name="email" placeholder="mail@website.com" value={formData.email} onChange={handleChange} required autoComplete="email" />
            </div>
            <div className="signup-field">
              <label htmlFor="signup-phone">Phone Number (Optional)</label>
              <input id="signup-phone" type="tel" name="phone" placeholder="10-digit mobile number" value={formData.phone} onChange={handleChange} autoComplete="tel" />
            </div>
            <div className="signup-field">
              <label htmlFor="signup-password">Password</label>
              <div className="signup-password-wrap">
                <input id="signup-password" type={showPassword ? "text" : "password"} name="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required minLength={8} autoComplete="new-password" aria-describedby="password-rules" />
                <button type="button" className="signup-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <FiEyeOff size={17} aria-hidden="true" /> : <FiEye size={17} aria-hidden="true" />}
                </button>
              </div>
              {formData.password && <p id="password-rules" aria-live="polite" className={`signup-password-rules ${missingPasswordRequirements.length ? "is-missing" : "is-met"}`}>
                {missingPasswordRequirements.length
                  ? `${missingPasswordRequirements.length} requirement${missingPasswordRequirements.length === 1 ? "" : "s"} remaining: ${missingPasswordRequirements.map(({ label }) => label).join(", ")}.`
                  : "Password meets all requirements."}
              </p>}
            </div>
            <button type="submit" className="signup-submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
            <p className="signup-footer">Already have an account? <a href="/login" onClick={(event) => { event.preventDefault(); navigate("/login"); }}>Sign in</a></p>
          </form>
        </section>

        <aside className="signup-panel signup-right-panel">
          <div key={formData.role} className="signup-role-content">
            <p className="signup-eyebrow"><span />Your first steps</p>
            <div className="signup-timeline">
              {signupContent[formData.role].steps.map(({ title, description, icon }, index) => (
                <div className="signup-step-row" key={title}>
                  <div className="signup-step-rail">
                    <span className={`signup-step-number step-${index + 1}`}>{index + 1}</span>
                    {index < 2 && <span className="signup-step-connector" />}
                  </div>
                  <article className="signup-step-card">
                    <div className="signup-step-title">
                      <h3>{title}</h3>
                      <SignupIcon name={icon} />
                    </div>
                    <p>{description}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Register;
