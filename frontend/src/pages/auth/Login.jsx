import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { loginUser } from "../../Services/authService";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaChessRook, FaBuilding } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import SkillBridgeLogo from "../../Components/SkillBridgeLogo";
import "../../Styles/pages/auth/Login.css";
import "../../Styles/pages/auth/mobile-bridge.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginRole, setLoginRole] = useState("candidate"); // Used for mobile UI context

  const location = useLocation();

  const redirectUser = (user) => {
    if (user?.role === "candidate") {
      const destination = location.state?.redirectAfterLogin || "/candidate-dashboard";
      
      navigate(destination, {
        state: {
          roleType: location.state?.roleType
        }
      });
    } else {
      if (user?.email?.toLowerCase() === "admin@gmail.com") { navigate("/admin/dashboard"); } else { navigate("/recruiter-dashboard"); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await loginUser({ email, password });
      localStorage.setItem("user", JSON.stringify(response.user));
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ name: user.displayName, email: user.email, idToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google Login Failed");
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      toast.success("Google login successful");
      redirectUser(data.user);
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.message || "Google Login Failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT — FORM CONTROL VIEWPORT */}
      <div className="login-form-panel">
        
        {/* MOBILE SUSPENSION BRIDGE SVG (Hidden on Desktop) */}
        <div className="mobile-bridge-svg-container">
          <svg className="suspension-bridge-svg" viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
            {/* Left Tower */}
            <line x1="40" y1="10" x2="40" y2="80" className="bridge-tower" />
            <circle cx="40" cy="5" r="4" className="bridge-dot left-dot" />
            {/* Right Tower */}
            <line x1="260" y1="10" x2="260" y2="80" className="bridge-tower" />
            <circle cx="260" cy="5" r="4" className="bridge-dot right-dot" />
            {/* Left Cables */}
            <line x1="40" y1="15" x2="150" y2="75" className="bridge-cable cable-draw-1" />
            <line x1="40" y1="35" x2="110" y2="75" className="bridge-cable cable-draw-2" />
            <line x1="40" y1="55" x2="70" y2="75" className="bridge-cable cable-draw-3" />
            {/* Right Cables */}
            <line x1="260" y1="15" x2="150" y2="75" className="bridge-cable cable-draw-1" />
            <line x1="260" y1="35" x2="190" y2="75" className="bridge-cable cable-draw-2" />
            <line x1="260" y1="55" x2="230" y2="75" className="bridge-cable cable-draw-3" />
            {/* Base Deck Line Removed to let card border act as the deck */}
          </svg>
        </div>

        <div className="login-form-inner deck-card">
          <div className="deck-header">SKILLBRIDGE DECK</div>
          
          <div className="login-brand" onClick={() => navigate("/")}>
            <SkillBridgeLogo width={265} />
          </div>

          <h1 className="login-title">Login</h1>
          <p className="login-subtitle">Find the job made for you!</p>

          {/* MOBILE ROLE SELECTOR (Hidden on Desktop) */}
          <div className="mobile-role-selector">
            <button 
              type="button"
              className={`role-segment ${loginRole === "candidate" ? "active" : ""}`}
              onClick={() => setLoginRole("candidate")}
            >
              <span className="role-icon"><FaChessRook /></span> Candidate side
            </button>
            <button 
              type="button"
              className={`role-segment ${loginRole === "recruiter" ? "active" : ""}`}
              onClick={() => setLoginRole("recruiter")}
            >
              <span className="role-icon"><FaBuilding /></span> Recruiter side
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <FcGoogle size={20} />
              {googleLoading ? "Please wait..." : "Continue with Google"}
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            {/* EMAIL BLOCK WITH BOLD HIGH-CONTRAST LABEL */}
            <div className="login-input-group">
              <label className="login-field-label">Email Address</label>
              <input
                type="email"
                placeholder="mail@website.com"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD BLOCK WITH BOLD HIGH-CONTRAST LABEL */}
            <div className="login-input-group">
              <label className="login-field-label">Password</label>
              <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="login-input"
                  style={{ paddingRight: "40px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  style={{
                    position: "absolute",
                    right: "4px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#4b5563",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px",
                    minWidth: "44px",
                    minHeight: "44px",
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <p className="login-forgot" style={{ textAlign: "right", margin: "4px 0 16px 0" }}>
              <span className="forgot-password-link" onClick={() => navigate("/forgot-password")} style={{ fontSize: "13.5px" }}>
                Forgot password?
              </span>
            </p>

            <button type="submit" className="login-submit-btn" disabled={loading} aria-label="Log in">
              {loading ? "Logging in..." : "Sign In"}
            </button>

            {/* STYLED TEXT SWITCHER SPAN */}
            <p className="login-bottom-text">
              <span className="desktop-link-text">Not registered? </span>
              <span className="mobile-link-text">Not registered? </span>
              <span className="link-action" onClick={() => navigate("/register", { state: { role: loginRole } })}>
                Sign up
              </span>
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL — ART SYSTEM CONTAINER */}
      <div className="login-art-panel">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>

        <div className="bg-square bg-square-1"></div>
        <div className="bg-square bg-square-2"></div>

        <div className="bg-dots bg-dots-1">
          {[...Array(12)].map((_, i) => <span key={i}></span>)}
        </div>

        <div className="bg-dots bg-dots-2">
          {[...Array(12)].map((_, i) => <span key={i}></span>)}
        </div>

        <div className="login-art-content">
          <h2>
            Find your next
            <br />
            opportunity.
          </h2>

          <p>
            Discover jobs, connect with recruiters,
            <br />
            and build the career you deserve.
          </p>

          <div className="stats-container">
            {/* TODO: These stats ("50K+ Jobs", "1K+ Recruiters", "20K+ Candidates") are currently hardcoded placeholders. 
                They should be wired to a real API endpoint returning live counts, or explicitly relabeled as illustrative/example figures. */}
            <div className="stats-card">
              <div className="stats-icon pink">💼</div>
              <h3>50K+</h3>
              <span>Jobs</span>
            </div>

            <div className="stats-card">
              <div className="stats-icon green">👥</div>
              <h3>1K+</h3>
              <span>Recruiters</span>
            </div>

            <div className="stats-card">
              <div className="stats-icon blue">👤</div>
              <h3>20K+</h3>
              <span>Candidates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
