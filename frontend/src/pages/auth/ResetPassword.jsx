import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

import SkillBridgeLogo from "../../Components/SkillBridgeLogo";
import AuthLayout from "../../Components/AuthLayout";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthLayout
      badge="Security Verification"
      headline="Set a new secure password for your account"
      subheadline="Ensure your new password contains at least 6 characters to safely resume accessing your dashboard."
      stats={[
        { label: "Encryption", value: "SHA-256" },
        { label: "Active Sessions", value: "Reset" },
        { label: "Verification", value: "Instant" },
      ]}
    >
      <div className="w-full max-w-sm sm:max-w-md bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] p-6 sm:p-8 space-y-4 animate-scale-up">
        {/* Brand Logo visible on mobile/tablet viewports (< lg) */}
        <div className="flex lg:hidden justify-center cursor-pointer mb-2" onClick={() => navigate("/")}>
          <SkillBridgeLogo width={190} center />
        </div>

        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-2 shadow-xs">
            <FiLock size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">Reset Password</h1>
          <p className="text-xs text-slate-500 mt-1.5 m-0 leading-relaxed">
            Enter your new strong password below to regain full account access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all duration-150"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 border-0 bg-transparent cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/20 border-0 disabled:opacity-50" 
            disabled={loading}
          >
            {loading ? "Updating Password..." : "Update Password →"}
          </button>

          <p className="text-center text-xs font-medium text-slate-500 m-0 pt-2">
            Remembered your password?{" "}
            <span 
              className="font-bold text-brand-600 hover:underline cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}

export default ResetPassword;