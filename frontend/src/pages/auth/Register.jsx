import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "../../Services/authService";
import { auth, provider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import "../../Styles/pages/auth/Register.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: location.state?.role || "candidate",
  });

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

  const handleGoogleSignup = async () => {
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
      if (!response.ok) throw new Error(data.message || "Google Authentication Failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Account initialized with Google successfully");
      redirectUser(data.user);
    } catch (error) {
      console.error("Google Auth Error:", error);
      toast.error(error.message || "Google Signup Failed");
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
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");

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
      toast.error(error?.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* LEFT PANEL — Modern Geometric Art Context */}
      <div className="register-art-panel">
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

        <div className="register-art-content">
          <h2>
            Start your
            <br />
            career journey.
          </h2>
          <p>
            Create your SkillBridge account, discover opportunities,
            <br />
            and connect with recruiters built for your future.
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

      {/* RIGHT PANEL — Sign Up Entry Credentials Section */}
      <div className="register-form-panel">
        <div className="register-form-inner">
          <div className="register-brand" onClick={() => navigate("/")}>
            <span className="register-brand-dot">Skill</span>Bridge
          </div>

          <h1 className="register-title">Sign Up</h1>
          <p className="register-subtitle">Start your journey with SkillBridge</p>

          <form onSubmit={handleSubmit} className="register-form">
            <button
              type="button"
              className="register-google-btn"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
            >
              <FcGoogle size={20} />
              {googleLoading ? "Please wait..." : "Sign up with Google"}
            </button>

            <div className="register-divider">
              <span>or Sign up with Email</span>
            </div>

            {/* FULL NAME BLOCK */}
            <div className="register-input-group">
              <label className="register-field-label">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter text"
                className="register-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* EMAIL BLOCK */}
            <div className="register-input-group">
              <label className="register-field-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="mail@website.com"
                className="register-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* PHONE NUMBER BLOCK */}
            <div className="register-input-group">
              <label className="register-field-label">Phone Number (Optional)</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                className="register-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* PASSWORD BLOCK */}
            <div className="register-input-group">
              <label className="register-field-label">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min 6 characters"
                className="register-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* ROLE SELECTION BLOCK */}
            <div className="register-input-group">
              <label className="register-field-label">Join As</label>
              <select
                name="role"
                className="register-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>

            <button type="submit" className="register-submit-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="register-bottom-text">
              Already have an account?{" "}
              <span onClick={() => navigate("/login")}>Login</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;