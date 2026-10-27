import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "../../Services/authService";
import { setStoredUser, getApiBaseUrl } from "../../Services/authUtils";
import { auth, provider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaChessRook, FaBuilding } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import SkillBridgeLogo from "../../Components/SkillBridgeLogo";
import { getPasswordRequirements, isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../../utils/passwordPolicy";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: location.state?.role || "candidate",
  });
  const passwordRequirements = getPasswordRequirements(formData.password);
  const missingPasswordRequirements = passwordRequirements.filter(({ met }) => !met);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const redirectUser = (user) => {
    if (user?.role === "candidate") navigate("/candidate-dashboard");
    else navigate("/recruiter-dashboard");
  };

  const handleGoogleSignup = async () => {
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
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : {};
      if (!response.ok) throw new Error(data.message || "Google Authentication Failed");
      setStoredUser(data.user, data.token);
      toast.success("Account initialized with Google successfully");
      redirectUser(data.user);
    } catch (error) {
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        return;
      }
      console.error("Google Auth Error:", error);
      let errMsg = error.message || "Google Signup Failed";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedPhone = formData.phone.trim();

    if (trimmedName.length < 3) return toast.error("Name must be at least 3 characters");
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) return toast.error("Name should contain only letters");
    if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) return toast.error("Enter a valid 10-digit phone number");
    if (!isStrongPassword(formData.password)) return toast.error(PASSWORD_POLICY_MESSAGE);

    try {
      setLoading(true);
      const formattedName = trimmedName.replace(/\s+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      const response = await registerUser({
        ...formData,
        name: formattedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      });

      toast.success(response.message || "Account created successfully");
      navigate("/login");
    } catch (error) {
      console.error("Registration Error:", error);
      const validationErrors = error?.response?.data?.errors;
      toast.error(error?.response?.data?.message || (Array.isArray(validationErrors) ? validationErrors[0] : null) || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-canvas-surface h-screen max-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-4 font-sans">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,440px)_minmax(0,1fr)] xl:gap-12">
      <aside className="hidden xl:block">
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#a3612b]">Make your next move</p>
        <h2 className="max-w-xs text-4xl font-black leading-tight tracking-tight text-[#30271f]">
          {formData.role === "candidate" ? "Find work that fits the life you want." : "Build the team that moves you forward."}
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-6 text-[#827361]">
          {formData.role === "candidate" ? "Create your profile, show what you do best, and discover roles made for you." : "Share your opportunities, meet skilled people, and grow your team."}
        </p>
        <div className="mt-8 space-y-4 text-sm font-semibold text-[#554737]">
          {(formData.role === "candidate"
            ? ["Roles matched to your skills", "Your applications, all in one place", "A clearer path to your next team"]
            : ["Reach candidates suited to your roles", "Review applicants in one place", "Build your team with confidence"]
          ).map((item, index) => (
            <div key={item} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e9dfd1] bg-[#fffaf2] text-[#a3612b]">
                {index === 0 ? <FaChessRook size={15} /> : <FaBuilding size={15} />}
              </span>
              {item}
            </div>
          ))}
        </div>
      </aside>

      <div className="w-full max-w-sm sm:max-w-md bg-gradient-to-br from-[#fffdf9] via-[#fffaf2] to-[#f8f0e4] rounded-2xl sm:rounded-3xl border border-[#e9dfd1] shadow-[0_20px_60px_rgba(110,80,45,0.14)] p-4 sm:py-5 sm:px-6 space-y-2 sm:space-y-3 animate-scale-up">
        <div className="flex justify-center cursor-pointer" onClick={() => navigate("/")}>
          <SkillBridgeLogo width={210} center />
        </div>

        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black text-[#30271f] tracking-tight m-0">Create an Account</h1>
          <p className="text-xs text-[#827361] mt-1 m-0">Start your journey with SkillBridge</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#f5ead9] rounded-xl border border-[#e9dfd1]">
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              formData.role === "candidate" ? "bg-[#fffdf9] text-[#3c342b] shadow-xs" : "bg-transparent text-[#827361] hover:text-[#40352a]"
            }`}
            onClick={() => setFormData(prev => ({ ...prev, role: "candidate" }))}
          >
            <FaChessRook size={13} /> <span>Candidate</span>
          </button>
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              formData.role === "recruiter" ? "bg-[#fffdf9] text-[#3c342b] shadow-xs" : "bg-transparent text-[#827361] hover:text-[#40352a]"
            }`}
            onClick={() => setFormData(prev => ({ ...prev, role: "recruiter" }))}
          >
            <FaBuilding size={13} /> <span>Recruiter</span>
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-3 bg-[#fffdf9] hover:bg-white border border-[#e7d8c4] text-[#40352a] font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
        >
          <FcGoogle size={19} />
          <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#e7d8c4]"></div>
          <span className="flex-shrink mx-2.5 text-[10px] font-bold text-[#a89883] uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-[#e7d8c4]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="text-[11px] font-bold text-[#625343] uppercase tracking-wider block mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 sm:py-2.5 bg-[#fffdf9] border border-[#e7d8c4] rounded-xl text-xs sm:text-sm text-[#30271f] placeholder:text-[#a89883] focus:bg-white focus:border-[#c58b50] focus:ring-2 focus:ring-[#c58b50]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#625343] uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="mail@website.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 sm:py-2.5 bg-[#fffdf9] border border-[#e7d8c4] rounded-xl text-xs sm:text-sm text-[#30271f] placeholder:text-[#a89883] focus:bg-white focus:border-[#c58b50] focus:ring-2 focus:ring-[#c58b50]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#625343] uppercase tracking-wider block mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2 sm:py-2.5 bg-[#fffdf9] border border-[#e7d8c4] rounded-xl text-xs sm:text-sm text-[#30271f] placeholder:text-[#a89883] focus:bg-white focus:border-[#c58b50] focus:ring-2 focus:ring-[#c58b50]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#625343] uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
                aria-describedby="password-rules"
                className="w-full px-3.5 py-2 sm:py-2.5 pr-9 bg-[#fffdf9] border border-[#e7d8c4] rounded-xl text-xs sm:text-sm text-[#30271f] placeholder:text-[#a89883] focus:bg-white focus:border-[#c58b50] focus:ring-2 focus:ring-[#c58b50]/20 outline-none transition-all"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a89883] hover:text-[#625343] p-1 border-0 bg-transparent cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
            {formData.password && <p id="password-rules" aria-live="polite" className={`mt-1.5 text-[10px] leading-4 ${missingPasswordRequirements.length ? "text-slate-500" : "text-emerald-700"}`}>
              {missingPasswordRequirements.length
                ? `${missingPasswordRequirements.length} requirement${missingPasswordRequirements.length === 1 ? "" : "s"} remaining: ${missingPasswordRequirements.map(({ label }) => label).join(", ")}.`
                : "Password meets all requirements."}
            </p>}
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-[#b96d3c] hover:bg-[#a45c31] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-[0_5px_14px_rgba(164,92,49,0.22)] border-0 disabled:opacity-50 mt-1.5"
            disabled={loading} 
            aria-label="Create account"
          >
            {loading ? "Creating Account..." : "Create Account →"}
          </button>

          <p className="text-center text-xs font-medium text-[#827361] m-0 pt-1.5 sm:pt-2">
            Already have an account?{" "}
            <span 
              className="font-bold text-[#a3612b] hover:text-[#814a24] hover:underline cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </form>
      </div>

      <aside aria-hidden="true" className="relative hidden h-[440px] xl:block">
        <div className="absolute right-4 top-10 h-64 w-64 rounded-full bg-[#f1ddc2]/60 blur-3xl" />
        <div className="absolute right-0 top-12 w-full max-w-[310px] space-y-3">
          <p className="px-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a3612b]">Your first steps</p>
          {(formData.role === "candidate"
            ? [
                ["01", "Create your profile", "Tell employers what you do best."],
                ["02", "Add your skills", "Help us find roles that fit."],
                ["03", "Explore opportunities", "Take the next step in your career."],
              ]
            : [
                ["01", "Set up your account", "Introduce your company to candidates."],
                ["02", "Post an opportunity", "Describe the role and skills you need."],
                ["03", "Meet great candidates", "Review applicants and build your team."],
              ]
          ).map(([step, title, detail], index) => (
            <div key={step} className={`rounded-2xl border border-[#e9dfd1] bg-[#fffdf9]/95 p-4 shadow-[0_16px_40px_rgba(110,80,45,0.08)] ${index === 1 ? "-translate-x-4" : ""}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f5ead9] text-[10px] font-extrabold text-[#a3612b]">{step}</span>
                <h3 className="m-0 text-sm font-extrabold text-[#30271f]">{title}</h3>
              </div>
              <p className="m-0 pl-9 text-xs leading-5 text-[#827361]">{detail}</p>
            </div>
          ))}
        </div>
      </aside>
      </div>
    </div>
  );
}

export default Register;
