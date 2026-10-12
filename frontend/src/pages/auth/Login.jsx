import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { loginUser } from "../../Services/authService";
import { setStoredUser, getApiBaseUrl } from "../../Services/authUtils";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaChessRook, FaBuilding, FaShieldAlt } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import SkillBridgeLogo from "../../Components/SkillBridgeLogo";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectDestination = searchParams.get("redirect") || location.state?.redirectAfterLogin || "";
  const isAdminTarget = 
    searchParams.get("admin") === "true" || 
    redirectDestination.includes("/admin") || 
    searchParams.get("role") === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginRole, setLoginRole] = useState(isAdminTarget ? "recruiter" : "candidate");

  const redirectUser = (user) => {
    const params = new URLSearchParams(location.search);
    const destination = params.get("redirect") || location.state?.redirectAfterLogin;

    if (destination && destination.startsWith("/")) {
      navigate(destination, {
        state: {
          roleType: location.state?.roleType
        }
      });
      return;
    }

    if (user?.role === "candidate") {
      navigate("/candidate-dashboard", {
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
      setStoredUser(response.user, response.token);
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
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/google-login`, {
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
      setStoredUser(data.user, data.token);
      toast.success("Google login successful");
      redirectUser(data.user);
    } catch (error) {
      console.error("Google Login Error:", error);
      let errMsg = error.message || "Google Login Failed";
      if (error?.code === "auth/unauthorized-domain") {
        errMsg = "Domain not authorized in Firebase Console. Add your domain to Firebase Auth -> Settings -> Authorized Domains.";
      } else if (error?.code === "auth/invalid-api-key" || error?.code === "auth/configuration-not-found") {
        errMsg = "Firebase API Key missing. Set VITE_FIREBASE_* in Vercel environment variables.";
      }
      toast.error(errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="app-canvas-surface min-h-screen w-full flex items-center justify-center px-4 py-8 font-sans">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#a3612b]">Make your next move</p>
          <h2 className="max-w-xs text-4xl font-black leading-tight tracking-tight text-[#30271f]">Find work that fits the life you want.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#827361]">A more thoughtful way to find a role, meet a team, and move your career forward.</p>
          <div className="mt-8 space-y-4 text-sm font-semibold text-[#554737]">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e9dfd1] bg-[#fffaf2] text-[#a3612b]"><FaChessRook size={15} /></span>{loginRole === "candidate" ? "Roles matched to your skills" : "Reach candidates suited to your roles"}</div>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e9dfd1] bg-[#fffaf2] text-[#a3612b]"><FaShieldAlt size={15} /></span>{loginRole === "candidate" ? "Your applications, all in one place" : "Review applicants in one place"}</div>
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e9dfd1] bg-[#fffaf2] text-[#a3612b]"><FaBuilding size={15} /></span>A clearer path to your next team</div>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-sm animate-scale-up sm:max-w-md">
        <div className="w-full bg-gradient-to-br from-[#fffdf9] via-[#fffaf2] to-[#f8f0e4] rounded-2xl sm:rounded-3xl border border-[#e9dfd1] shadow-[0_20px_60px_rgba(110,80,45,0.14)] p-5 sm:py-7 sm:px-6 space-y-3 sm:space-y-4">
        <div className="flex justify-center cursor-pointer" onClick={() => navigate("/")}>
          <SkillBridgeLogo width={210} center />
        </div>

        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black text-[#30271f] tracking-tight m-0">Welcome Back</h1>
          <p className="text-xs text-[#827361] mt-1 m-0">Find the job made for you!</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#f5ead9] rounded-xl border border-[#e9dfd1]">
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              loginRole === "candidate" ? "bg-[#fffdf9] text-[#3c342b] shadow-xs" : "bg-transparent text-[#827361] hover:text-[#40352a]"
            }`}
            onClick={() => setLoginRole("candidate")}
          >
            <FaChessRook size={13} /> <span>Candidate</span>
          </button>
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              loginRole === "recruiter" ? "bg-[#fffdf9] text-[#3c342b] shadow-xs" : "bg-transparent text-[#827361] hover:text-[#40352a]"
            }`}
            onClick={() => setLoginRole("recruiter")}
          >
            <FaBuilding size={13} /> <span>Recruiter</span>
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-3 bg-[#fffdf9] hover:bg-[#fff7eb] border border-[#e9dfd1] text-[#554737] font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          <FcGoogle size={19} />
          <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#e9dfd1]"></div>
          <span className="flex-shrink mx-2.5 text-[10px] font-bold text-[#a18d74] uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-[#e9dfd1]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="text-[11px] font-bold text-[#625343] uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="mail@website.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 sm:py-2.5 bg-[#fffdf9] border border-[#e7d8c4] rounded-xl text-xs sm:text-sm text-[#30271f] placeholder:text-[#a89883] focus:bg-white focus:border-[#c58b50] focus:ring-2 focus:ring-[#c58b50]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#625343] uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 sm:py-2.5 pr-9 bg-[#fffdf9] border border-[#e7d8c4] rounded-xl text-xs sm:text-sm text-[#30271f] placeholder:text-[#a89883] focus:bg-white focus:border-[#c58b50] focus:ring-2 focus:ring-[#c58b50]/20 outline-none transition-all"
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
              className="text-xs font-bold text-[#a3612b] hover:text-[#814a24] cursor-pointer"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-[#b96d3c] hover:bg-[#a45c31] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-[0_5px_14px_rgba(164,92,49,0.22)] border-0 disabled:opacity-50 mt-1.5"
            disabled={loading} 
            aria-label="Log in"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>

          <p className="text-center text-xs font-medium text-[#827361] m-0 pt-1.5 sm:pt-2">
            Not registered?{" "}
            <span 
              className="font-bold text-[#a3612b] hover:text-[#814a24] hover:underline cursor-pointer"
              onClick={() => navigate("/register", { state: { role: loginRole } })}
            >
              Sign up
            </span>
          </p>
        </form>
        </div>
        </div>

        <aside aria-hidden="true" className="relative hidden h-[440px] lg:block">
          <div className="absolute right-4 top-10 h-64 w-64 rounded-full bg-[#f1ddc2]/60 blur-3xl" />
          <div className="absolute right-0 top-8 w-[270px] rotate-2 rounded-2xl border border-[#e9dfd1] bg-[#fffdf9] p-4 shadow-[0_16px_40px_rgba(110,80,45,0.12)]">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a3612b]">Example match</p>
            <h3 className="m-0 text-base font-extrabold text-[#30271f]">Data Engineer</h3>
            <p className="mt-1 text-xs text-[#827361]">Cloud data team / Flexible</p>
            <div className="mt-4 flex gap-2"><span className="rounded-full bg-[#f5ead9] px-2.5 py-1 text-[10px] font-bold text-[#795431]">GCP</span><span className="rounded-full bg-[#f5ead9] px-2.5 py-1 text-[10px] font-bold text-[#795431]">2-5 years</span></div>
          </div>
          <div className="absolute bottom-14 left-0 w-[255px] -rotate-2 rounded-2xl border border-[#e9dfd1] bg-[#fffaf2] p-4 shadow-[0_16px_40px_rgba(110,80,45,0.12)]">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a3612b]">Another possibility</p>
            <h3 className="m-0 text-base font-extrabold text-[#30271f]">Product Analyst</h3>
            <p className="mt-1 text-xs text-[#827361]">Product &amp; insights / Hybrid</p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#eadfce]"><div className="h-full w-4/5 rounded-full bg-[#c58b50]" /></div>
          </div>
          <div className="absolute bottom-4 right-1 rounded-full border border-[#e9dfd1] bg-[#fffdf9]/90 px-3 py-2 text-[10px] font-bold text-[#795431] shadow-sm">A good next step starts here</div>
        </aside>
      </div>
    </div>
  );
}

export default Login;
