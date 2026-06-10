import { useState } from "react";
import careerImage from "../assets/undraw_career-progress_vfq5.svg";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../Services/authService";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser({ email, password });
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      if (response.user.role === "candidate") {
        navigate("/candidate-dashboard");
      } else {
        navigate("/recruiter-dashboard");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const response = await fetch("http://localhost:5000/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.displayName, email: user.email }),
      });

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "candidate") {
        navigate("/candidate-dashboard");
      } else {
        navigate("/recruiter-dashboard");
      }
    } catch (error) {
      console.log(error);
      alert("Google Login Failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-page">
        <div className="auth-left">
          <img src={careerImage} alt="career" className="auth-illustration" />
          <h1 className="brand-heading">Find your next opportunity.</h1>
          <p className="brand-text">Discover jobs, connect with recruiters, and build the career you deserve.</p>
          <div className="stats-row">
            <div className="stat-card"><h3>50K+</h3><p>Jobs</p></div>
            <div className="stat-card"><h3>1K+</h3><p>Recruiters</p></div>
            <div className="stat-card"><h3>20K+</h3><p>Candidates</p></div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <h1 className="auth-title">Login</h1>
            <form onSubmit={handleSubmit}>
              <button type="button" className="google-btn" onClick={handleGoogleLogin}>
                <FcGoogle size={22} /> Continue with Google
              </button>
              <div className="auth-divider">
                <span>Or continue with email</span>
              </div>
              <input type="email" placeholder="Email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="submit" className="auth-btn">Login</button>
              <p className="auth-bottom-text">
                Start your journey with SkillBridge,{" "}
                <span className="auth-link" onClick={() => navigate("/register")}>Sign Up</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;