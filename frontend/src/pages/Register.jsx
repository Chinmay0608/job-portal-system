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
    <div className="auth-container">
      <div className="auth-card">

        <h1 className="auth-title">
          Create Account
        </h1>

        <p className="auth-subtitle">
          Start your journey with SkillBridge.
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
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>

          <button
            type="submit"
            className="auth-btn"
          >
            Register
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