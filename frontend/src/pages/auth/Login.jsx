import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { loginUser } from "../../Services/authService";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import "../../Styles/pages/auth/Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      navigate("/recruiter-dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await loginUser({ email, password });
      localStorage.setItem("token", response.token);
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.displayName, email: user.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google Login Failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
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
        <div className="login-form-inner">
          <div className="login-brand" onClick={() => navigate("/")}>
            <span className="login-brand-dot">Skill</span>Bridge
          </div>

          <h1 className="login-title">Login</h1>
          <p className="login-subtitle">Find the job made for you!</p>

          <form onSubmit={handleSubmit} className="login-form">
            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <FcGoogle size={20} />
              {googleLoading ? "Please wait..." : "Log in with Google"}
            </button>

            <div className="login-divider">
              <span>or Login with Email</span>
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
              <input
                type="password"
                placeholder="Enter password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <p className="login-forgot">
              <span onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </span>
            </p>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>

            {/* STYLED TEXT SWITCHER SPAN */}
            <p className="login-bottom-text">
              Not registered?{" "}
              <span onClick={() => navigate("/register")}>
                Create an Account
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