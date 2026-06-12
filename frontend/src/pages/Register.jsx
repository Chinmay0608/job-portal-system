import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../Services/authService";
import toast from "react-hot-toast";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "candidate",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();

    /* Name Validation */
    const nameRegex = /^[A-Za-z\s]+$/;

    if (trimmedName.length < 3) {
      return toast.error("Name must be at least 3 characters");
    }
    if (!nameRegex.test(trimmedName)) {
      return toast.error("Name should contain only letters");
    }
    if (/\s{2,}/.test(trimmedName)) {
      return toast.error("Extra spaces are not allowed");
    }

    /* Email Validation */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return toast.error("Invalid email format");
    }

    const allowedDomains = [
      "gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
      "icloud.com", "proton.me", "protonmail.com", "yahoo.in"
    ];
    const emailDomain = trimmedEmail.split("@")[1];

    if (!allowedDomains.includes(emailDomain)) {
      return toast.error("Please enter a valid email provider");
    }

    /* Phone Validation */
    if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
      return toast.error("Enter a valid phone number");
    }

    /* Password Validation */
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      setLoading(true);

      const formattedName = trimmedName
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const response = await registerUser({
        ...formData,
        name: formattedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      });

      toast.success(response.message || "Account created successfully");
      navigate("/login");
    } catch (error) {
      console.error("Register Error:", error);
      toast.error(error?.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Side */}
      <div className="auth-left">
        <img src="/undraw_job-hunt_5umi.svg" alt="illustration" className="auth-illustration" />
        <h1 className="brand-heading">Start your career journey.</h1>
        <p className="brand-text">
          Create your SkillBridge account, connect with recruiters, and discover opportunities built for your future.
        </p>

        <div className="stats-row">
          <div className="stat-card"><h2>50K+</h2><p>Jobs</p></div>
          <div className="stat-card"><h2>1K+</h2><p>Recruiters</p></div>
          <div className="stat-card"><h2>20K+</h2><p>Candidates</p></div>
        </div>
      </div>

      {/* Register Form */}
      <div className="auth-right">
        <h1 className="auth-title">Sign Up</h1>
        <p className="auth-subtitle">Start your journey with SkillBridge</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="auth-input"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="auth-input"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            className="auth-input"
            value={formData.phone}
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <select name="role" className="auth-input" value={formData.role} onChange={handleChange}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="auth-bottom-text">
            Already have an account?{" "}
            <span className="auth-link" onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;