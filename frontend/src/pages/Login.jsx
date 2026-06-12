import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { loginUser } from "../Services/authService";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import careerImage from "../assets/undraw_career-progress_vfq5.svg";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const redirectUser = (user) => {
    if (user?.role === "candidate") {
      navigate("/candidate-dashboard");
    } else {
      navigate("/recruiter-dashboard");
    }
  };

  /* Normal Login */
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

  /* Google Login */
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const response = await fetch(`${API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.displayName, email: user.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Google Login Failed");
      }

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
    <div className="auth-container">
      <div className="auth-page">
        {/* Left Side */}
        <div className="auth-left">
          <img src={careerImage} alt="career" className="auth-illustration" />
          <h1 className="brand-heading">Find your next opportunity.</h1>
          <p className="brand-text">
            Discover jobs, connect with recruiters, and build the career you deserve.
          </p>

          <div className="stats-row">
            <div className="stat-card"><h3>50K+</h3><p>Jobs</p></div>
            <div className="stat-card"><h3>1K+</h3><p>Recruiters</p></div>
            <div className="stat-card"><h3>20K+</h3><p>Candidates</p></div>
          </div>
        </div>

        {/* Right Side */}
        <div className="auth-right">
          <div className="auth-card">
            <h1 className="auth-title">Login</h1>

            <form onSubmit={handleSubmit}>
              <button
                type="button"
                className="google-btn"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                <FcGoogle size={22} />
                {googleLoading ? "Please wait..." : "Continue with Google"}
              </button>

              <div className="auth-divider">
                <span>Or continue with email</span>
              </div>

              <input
                type="email"
                placeholder="Email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <p style={{ textAlign: "right", marginBottom: "15px" }}>
                <span className="auth-link" onClick={() => navigate("/forgot-password")}>
                  Forgot Password?
                </span>
              </p>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="auth-bottom-text">
                Start your journey with SkillBridge,{" "}
                <span className="auth-link" onClick={() => navigate("/register")}>
                  Sign Up
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;