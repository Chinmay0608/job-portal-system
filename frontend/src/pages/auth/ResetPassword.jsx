import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { getApiBaseUrl } from "../../Services/authUtils";
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../../utils/passwordPolicy";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(password)) return toast.error(PASSWORD_POLICY_MESSAGE);
    if (!token) {
      return toast.error("Invalid reset token");
    }

    try {
      setLoading(true);
      const response = await axios.put(`${getApiBaseUrl()}/api/auth/reset-password/${token}`, {
        password,
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
        <p className="auth-subtitle">Use at least 8 characters, including uppercase and lowercase letters, a number, and 1–3 special characters. No spaces.</p>

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
