import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import SkillBridgeLogo from "../../Components/SkillBridgeLogo";
import { getApiBaseUrl } from "../../Services/authUtils";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      return toast.error("Email is required");
    }

    try {
      setLoading(true);
      const response = await axios.post(`${getApiBaseUrl()}/api/auth/forgot-password`, { email });

      toast.success(response?.data?.message || "Reset link sent successfully");
      navigate("/login");
    } catch (error) {
      console.error("Forgot Password Error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-right">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", cursor: "pointer" }} onClick={() => navigate("/")}>
          <SkillBridgeLogo width={345} center />
        </div>
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your email to receive reset link</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;