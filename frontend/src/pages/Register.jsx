import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "candidate",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await registerUser(formData);

      alert(response.message);
      navigate("/login");

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Registration Failed"
      );
    }
  };

  return (
    <div className="auth-page">

      {/* Left Side */}
      <div className="auth-left">

        <img
          src="/undraw_job-hunt_5umi.svg"
          alt="illustration"
          className="auth-illustration"
        />

        <h1 className="brand-heading">
          Start your career journey.
        </h1>

        <p className="brand-text">
          Create your SkillBridge account,
          connect with recruiters, and
          discover opportunities built
          for your future.
        </p>

        <div className="stats-row">
          <div className="stat-card">
            <h2>50K+</h2>
            <p>Jobs</p>
          </div>

          <div className="stat-card">
            <h2>1K+</h2>
            <p>Recruiters</p>
          </div>

          <div className="stat-card">
            <h2>20K+</h2>
            <p>Candidates</p>
          </div>
        </div>

      </div>

      {/* Right Side Register Card */}
      <div className="auth-right">

        <h1 className="auth-title">
          Sign Up
        </h1>

        <p className="auth-subtitle">
          Start your journey with SkillBridge
        </p>

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

          <select
            name="role"
            className="auth-input"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="candidate">
              Candidate
            </option>

            <option value="recruiter">
              Recruiter
            </option>
          </select>

          <button
            type="submit"
            className="auth-btn"
          >
            Create Account
          </button>

          <p className="auth-bottom-text">
            Already have an account?{" "}
            <span
              className="auth-link"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>

        </form>
      </div>

    </div>
  );
}

export default Register;