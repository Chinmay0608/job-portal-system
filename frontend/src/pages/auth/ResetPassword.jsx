import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedPassword = password.trim();

    /* Validation */
    if (trimmedPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (!token) {
      return toast.error("Invalid reset token");
    }

    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/api/auth/reset-password/${token}`, {
        password: trimmedPassword,
      });

      toast.success(response?.data?.message || "Password reset successful");
      navigate("/login");
    } catch (error) {
      console.error("Reset Password Error:", error);
      toast.error(error?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-right">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new password</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;