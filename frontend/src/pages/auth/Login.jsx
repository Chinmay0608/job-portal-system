import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { loginUser } from "../../Services/authService";
import { setStoredUser, getApiBaseUrl } from "../../Services/authUtils";
import { getJobs } from "../../Services/jobService";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaBullseye, FaClipboardList, FaUsers } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectDestination = searchParams.get("redirect") || location.state?.redirectAfterLogin || "";
  const isAdminTarget = 
    searchParams.get("admin") === "true" || 
    redirectDestination.includes("/admin") || 
    searchParams.get("role") === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginRole, setLoginRole] = useState(isAdminTarget ? "recruiter" : "candidate");
  const [previewJobs, setPreviewJobs] = useState([]);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const [tickerPhase] = useState(Math.random);

  useEffect(() => {
    let isCancelled = false;
    getRedirectResult(auth)
      .then(async (result) => {
        if (isCancelled || !result?.user) return;
        setGoogleLoading(true);
        const user = result.user;
        const idToken = await user.getIdToken();
        const pendingRole = sessionStorage.getItem("pending_google_role") || loginRole;
        const pendingRedirect = sessionStorage.getItem("pending_google_redirect");
        sessionStorage.removeItem("pending_google_role");
        sessionStorage.removeItem("pending_google_redirect");

        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/auth/google-login`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-requested-with": "XMLHttpRequest"
          },
          credentials: "include",
          body: JSON.stringify({ name: user.displayName, email: user.email, idToken, ...(isAdminTarget || !pendingRole ? {} : { role: pendingRole }) }),
        });
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await response.json() : {};
        if (!response.ok) throw new Error(data.message || "Google Login Failed");
        setStoredUser(data.user, data.token);
        toast.success("Google login successful");
        if (pendingRedirect) {
          navigate(pendingRedirect, { replace: true });
        } else {
          redirectUser(data.user);
        }
      })
      .catch((error) => {
        if (isCancelled) return;
        if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") return;
        console.error("Google Redirect Login Error:", error);
        toast.error(error?.message || "Google Login Failed");
      })
      .finally(() => {
        if (!isCancelled) setGoogleLoading(false);
      });

    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchPreviewJobs = async () => {
      try {
        const result = await getJobs({ page: 1, limit: 60 });
        const seenJobs = new Set();
        const jobs = (result?.jobs || []).filter((job) => {
          const title = job.title?.trim().toLowerCase();
          const company = job.company?.trim().toLowerCase();
          const key = `${title}|${company}`;
          if (!title || !job._id || seenJobs.has(key)) return false;
          seenJobs.add(key);
          return true;
        }).slice(0, 15);
        if (!cancelled && jobs.length >= 2) {
          setPreviewJobs(jobs);
        }
      } catch {
        // Leave the ticker hidden when the live jobs feed is unavailable.
      }
    };

    fetchPreviewJobs();
    return () => { cancelled = true; };
  }, []);

  const redirectUser = (user) => {
    const params = new URLSearchParams(location.search);
    const destination = params.get("redirect") || location.state?.redirectAfterLogin;

    const destinationForRole = user?.role === "recruiter"
      ? (destination?.startsWith("/recruiter-") ? destination : "/recruiter-dashboard")
      : user?.role === "admin"
        ? (destination?.startsWith("/admin") ? destination : "/admin/dashboard")
        : ["/candidate-dashboard", "/candidate-profile", "/my-applications", "/jobs"].some((path) => destination === path || destination?.startsWith(`${path}?`))
          ? destination
          : "/candidate-dashboard";

    if (destinationForRole && destinationForRole !== "/recruiter-dashboard" && destinationForRole !== "/admin/dashboard" && destinationForRole !== "/candidate-dashboard") {
      navigate(destinationForRole, { state: { roleType: location.state?.roleType } });
      return;
    }

    navigate(destinationForRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await loginUser({ email, password, ...(isAdminTarget ? {} : { role: loginRole }) });
      setStoredUser(response.user, response.token);
      toast.success("Login successful");
      redirectUser(response.user);
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
        body: JSON.stringify({ name: user.displayName, email: user.email, idToken, ...(isAdminTarget ? {} : { role: loginRole }) }),
      });
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : {};
      if (!response.ok) throw new Error(data.message || "Google Login Failed");
      setStoredUser(data.user, data.token);
      toast.success("Google login successful");
      redirectUser(data.user);
    } catch (error) {
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        return;
      }
      if (error?.code === "auth/popup-blocked") {
        console.warn("Popup blocked by browser. Attempting redirect fallback...");
        toast.loading("Popup blocked by browser. Redirecting to Google Sign-In...", { id: "google-auth-toast", duration: 5000 });
        sessionStorage.setItem("pending_google_role", isAdminTarget ? "" : loginRole);
        sessionStorage.setItem("pending_google_redirect", redirectDestination || "");
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error("Redirect fallback failed:", redirectError);
          toast.dismiss("google-auth-toast");
          toast.error("Pop-up blocked. Please click the pop-up icon in your address bar to allow pop-ups for this site.", { duration: 7000 });
          return;
        }
      }
      console.error("Google Login Error:", error);
      let errMsg = error.message || "Google Login Failed";
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

  const tickerDuration = Math.max(previewJobs.length * 3.5, 10);

  return (
    <main className="signup-page login-auth-page">
      <div aria-hidden="true" className="signup-decoration signup-decoration-top" />
      <div aria-hidden="true" className="signup-decoration signup-decoration-bottom" />
      <div className="signup-layout">
        <aside className="signup-panel signup-left-panel">
          <div key={loginRole} className="signup-role-content">
            <p className="signup-eyebrow"><span />{loginRole === "candidate" ? "Make your next move" : "Find your next hire"}</p>
            <h1 className="signup-headline">
              {loginRole === "candidate" ? "Find work that" : "Find great talent"}{" "}
              <span className="signup-headline-accent">
                {loginRole === "candidate" ? "fits the life you want." : "and build your team."}
                <svg aria-hidden="true" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M2 6c30-5 60 3 96-1s60-3 100 0" /></svg>
              </span>
            </h1>
            <p className="signup-intro">{loginRole === "candidate" ? "A more thoughtful way to find a role, meet a team, and move your career forward." : "Meet skilled people, review applicants, and build a team that moves your company forward."}</p>
            <div className="signup-benefits">
              {[loginRole === "candidate" ? "Roles matched to your skills" : "Reach candidates suited to your roles", loginRole === "candidate" ? "Your applications, all in one place" : "Review applicants in one place", loginRole === "candidate" ? "A clearer path to your next team" : "A simpler path to your next hire"].map((item, index) => (
                <div className="signup-benefit" key={item}>
                  <span className="signup-benefit-icon">
                    {index === 0 ? (
                      <FaBullseye aria-hidden="true" />
                    ) : index === 1 ? (
                      <FaClipboardList aria-hidden="true" />
                    ) : (
                      <FaUsers aria-hidden="true" />
                    )}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="signup-card login-card" aria-labelledby="login-card-title">
          <button type="button" className="signup-logo brand-wordmark" onClick={() => navigate("/")} aria-label="SkillBridge home">
            <span>Skill</span><span>Bridge</span>
          </button>

          <div className="signup-card-heading">
            <h2 id="login-card-title">Welcome Back</h2>
            <p>Find the job made for you!</p>
          </div>

        {/* Role Selector Tabs */}
        <div className="signup-role-toggle" role="group" aria-label="Choose account type">
          <button type="button" aria-pressed={loginRole === "candidate"} className={loginRole === "candidate" ? "is-active" : ""} onClick={() => setLoginRole("candidate")}>Candidate</button>
          <button type="button" aria-pressed={loginRole === "recruiter"} className={loginRole === "recruiter" ? "is-active" : ""} onClick={() => setLoginRole("recruiter")}>Recruiter</button>
        </div>

        <button type="button" className="signup-google" onClick={handleGoogleLogin} disabled={googleLoading}>
          <FcGoogle size={19} aria-hidden="true" />
          <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
        </button>

        <div className="signup-divider"><span>OR</span></div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="signup-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="mail@website.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="signup-field">
            <label htmlFor="login-password">Password</label>
            <div className="signup-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="signup-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <FiEyeOff size={17} aria-hidden="true" /> : <FiEye size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="login-forgot"><a href="/forgot-password" onClick={(event) => { event.preventDefault(); navigate("/forgot-password"); }}>Forgot password?</a></div>

          <button type="submit" className="signup-submit" disabled={loading} aria-label="Log in">
            {loading ? "Logging in..." : "Sign In"}
          </button>

          <p className="signup-footer">Not registered? <a href="/register" onClick={(event) => { event.preventDefault(); navigate("/register", { state: { role: loginRole } }); }}>Sign up</a></p>
        </form>
        </section>

        <aside aria-hidden="true" className="signup-panel signup-right-panel login-right-panel h-[440px]">
          {previewJobs.length >= 2 ? (
            <div className="login-job-ticker absolute right-0 top-8 h-[420px] w-[330px]" style={{ "--ticker-duration": `${tickerDuration}s`, "--ticker-delay": `${-tickerDuration * tickerPhase}s` }}>
              <div className="login-job-ticker-track" style={{ animationPlayState: isPreviewHovered ? "paused" : "running" }}>
                {[0, 1].map((copy) => (
                  <div className="login-job-ticker-group" key={copy}>
                    {previewJobs.map((job, index) => {
                      const detail = [job.company, job.location].filter(Boolean).join(" / ");
                      const tags = [job.skillsRequired?.[0] || job.employmentType, job.experienceRequired]
                        .filter((tag) => tag && tag !== "Not Specified");
                      return (
                        <article
                          className="login-job-ticker-card"
                          key={`${job._id}-${index}`}
                          onPointerEnter={() => setIsPreviewHovered(true)}
                          onPointerLeave={() => setIsPreviewHovered(false)}
                        >
                          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a3612b]">Live opportunity</p>
                          <h3 className="m-0 truncate text-base font-extrabold text-[#30271f]">{job.title}</h3>
                          <p className="mt-1 truncate text-xs text-[#827361]">{detail || job.domain || "Explore this opportunity"}</p>
                          <div className="mt-4 flex gap-2 overflow-hidden">
                            {tags.slice(0, 2).map((tag) => <span key={tag} className="truncate rounded-full bg-[#f5ead9] px-2.5 py-1 text-[10px] font-bold text-[#795431]">{tag}</span>)}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="login-opportunity-card">
              <p className="signup-eyebrow"><span />Your next step</p>
              <h3>{loginRole === "candidate" ? "New opportunities, every day." : "Meet your next great hire."}</h3>
              <p>{loginRole === "candidate" ? "Sign in to find roles that fit your skills and goals." : "Sign in to review applicants and move great candidates forward."}</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

export default Login;
