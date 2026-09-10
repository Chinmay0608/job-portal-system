import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMail, FiArrowLeft } from "react-icons/fi";

import SkillBridgeLogo from "../../Components/SkillBridgeLogo";
import AuthLayout from "../../Components/AuthLayout";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      return toast.error("Email is required");
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });

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
    <AuthLayout
      badge="Account Recovery"
      headline="Reset and secure your SkillBridge account"
      subheadline="Enter the verified email linked to your candidate or recruiter profile to receive instant password reset instructions."
      stats={[
        { label: "Delivery Speed", value: "< 1 Min" },
        { label: "Link Validity", value: "60 Mins" },
        { label: "Security Level", value: "256-bit" },
      ]}
    >
      <div className="w-full max-w-sm sm:max-w-md bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] p-6 sm:p-8 space-y-4 animate-scale-up">
        {/* Brand Logo visible on mobile/tablet viewports (< lg) */}
        <div className="flex lg:hidden justify-center cursor-pointer mb-2" onClick={() => navigate("/")}>
          <SkillBridgeLogo width={190} center />
        </div>

        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-2 shadow-xs">
            <FiMail size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">Forgot Password</h1>
          <p className="text-xs text-slate-500 mt-1.5 m-0 leading-relaxed">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Registered Email Address
            </label>
            <input
              type="email"
              placeholder="mail@website.com"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all duration-150"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/20 border-0 disabled:opacity-50" 
            disabled={loading}
          >
            {loading ? "Sending Instructions..." : "Send Reset Link →"}
          </button>

          <p className="text-center text-xs font-medium text-slate-500 m-0 pt-2">
            Remembered your password?{" "}
            <span 
              className="font-bold text-brand-600 hover:underline cursor-pointer inline-flex items-center gap-1"
              onClick={() => navigate("/login")}
            >
              Back to sign in
            </span>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;