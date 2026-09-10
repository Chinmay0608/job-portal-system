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
    <div className="h-screen max-h-screen w-full bg-slate-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden font-sans">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-5 sm:py-7 sm:px-6 space-y-3 sm:space-y-4 -translate-y-1 sm:-translate-y-2 animate-scale-up">
        <div className="flex justify-center cursor-pointer" onClick={() => navigate("/")}>
          <SkillBridgeLogo width={210} center />
        </div>

        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight m-0">Welcome Back</h1>
          <p className="text-xs text-slate-500 mt-1 m-0">Find the job made for you!</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              loginRole === "candidate" ? "bg-white text-slate-900 shadow-xs" : "bg-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setLoginRole("candidate")}
          >
            <FaChessRook size={13} /> <span>Candidate</span>
          </button>
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              loginRole === "recruiter" ? "bg-white text-slate-900 shadow-xs" : "bg-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setLoginRole("recruiter")}
          >
            <FaBuilding size={13} /> <span>Recruiter</span>
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          <FcGoogle size={19} />
          <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="mail@website.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 sm:py-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 border-0 bg-transparent cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span 
              className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0 disabled:opacity-50 mt-1.5" 
            disabled={loading} 
            aria-label="Log in"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>

          <p className="text-center text-xs font-medium text-slate-500 m-0 pt-1.5 sm:pt-2">
            Not registered?{" "}
            <span 
              className="font-bold text-brand-600 hover:underline cursor-pointer" 
              onClick={() => navigate("/register", { state: { role: loginRole } })}
            >
              Sign up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
