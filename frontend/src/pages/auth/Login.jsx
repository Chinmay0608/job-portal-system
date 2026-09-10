import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { loginUser } from "../../Services/authService";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaChessRook, FaBuilding } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import SkillBridgeLogo from "../../Components/SkillBridgeLogo";
import AuthLayout from "../../Components/AuthLayout";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginRole, setLoginRole] = useState("candidate");

  const location = useLocation();

  const redirectUser = (user) => {
    if (user?.role === "candidate") {
      const destination = location.state?.redirectAfterLogin || "/candidate-dashboard";
      
      navigate(destination, {
        state: {
          roleType: location.state?.roleType
        }
      });
    } else if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/recruiter-dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await loginUser({ email, password });
      localStorage.setItem("user", JSON.stringify(response.user));
      toast.success("Login successful");
      redirectUser(response.user);
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-requested-with": "XMLHttpRequest"
        },
        credentials: "include",
        body: JSON.stringify({ name: user.displayName, email: user.email, idToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google Login Failed");
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      toast.success("Google login successful");
      redirectUser(data.user);
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.message || "Google Login Failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Career Acceleration"
      headline="Welcome back to your career command center"
      subheadline="Access verified job opportunities, manage applications, and connect directly with hiring managers."
      stats={[
        { label: "Active Openings", value: "2,400+" },
        { label: "Interview Rate", value: "3.2x" },
        { label: "Partner Rating", value: "4.9/5" },
      ]}
    >
      <div className="relative w-full max-w-sm sm:max-w-md bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(37,99,235,0.12)] rounded-3xl p-5 sm:py-6 sm:px-7 space-y-3 sm:space-y-3.5 animate-scale-up overflow-hidden">
        {/* Top Brand Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent pointer-events-none" />

        {/* Brand Logo visible on mobile/tablet viewports (< lg) */}
        <div className="flex lg:hidden justify-center cursor-pointer pt-1" onClick={() => navigate("/")}>
          <SkillBridgeLogo width={190} center />
        </div>

        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">Welcome Back</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">Find the job made for you!</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              loginRole === "candidate" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700" : "bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setLoginRole("candidate")}
          >
            <FaChessRook size={13} /> <span>Candidate</span>
          </button>
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              loginRole === "recruiter" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-700" : "bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setLoginRole("recruiter")}
          >
            <FaBuilding size={13} /> <span>Recruiter</span>
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-sm active:scale-95"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          <FcGoogle size={19} />
          <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
        </button>

        <div className="relative flex py-0.5 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700/60"></div>
          <span className="flex-shrink mx-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700/60"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="mail@website.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 outline-none transition-all duration-150"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 sm:py-2.5 pr-9 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 outline-none transition-all duration-150"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 border-0 bg-transparent cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span 
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 cursor-pointer"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-600/25 active:scale-[0.99] border-0 disabled:opacity-50 mt-1.5" 
            disabled={loading} 
            aria-label="Log in"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>

          <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 m-0 pt-1.5 sm:pt-2">
            Not registered?{" "}
            <span 
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer" 
              onClick={() => navigate("/register", { state: { role: loginRole } })}
            >
              Sign up
            </span>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}

export default Login;
