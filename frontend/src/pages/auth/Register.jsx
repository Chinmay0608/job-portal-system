import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "../../Services/authService";
import { auth, provider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaChessRook, FaBuilding } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import SkillBridgeLogo from "../../Components/SkillBridgeLogo";

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
      if (!response.ok) throw new Error(data.message || "Google Authentication Failed");
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Account initialized with Google successfully");
      redirectUser(data.user);
    } catch (error) {
      console.error("Google Auth Error:", error);
      toast.error(error.message || "Google Signup Failed");
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
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");

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
      toast.error(error?.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5 animate-scale-up">
        <div className="flex justify-center cursor-pointer" onClick={() => navigate("/")}>
          <SkillBridgeLogo width={280} center />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">Create an Account</h1>
          <p className="text-xs text-slate-500 mt-1 m-0">Start your journey with SkillBridge</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              formData.role === "candidate" ? "bg-white text-slate-900 shadow-xs" : "bg-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setFormData(prev => ({ ...prev, role: "candidate" }))}
          >
            <FaChessRook /> <span>Candidate</span>
          </button>
          <button 
            type="button"
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
              formData.role === "recruiter" ? "bg-white text-slate-900 shadow-xs" : "bg-transparent text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => setFormData(prev => ({ ...prev, role: "recruiter" }))}
          >
            <FaBuilding /> <span>Recruiter</span>
          </button>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs active:scale-95"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
        >
          <FcGoogle size={20} />
          <span>{googleLoading ? "Please wait..." : "Continue with Google"}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="mail@website.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
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
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-sm border-0 disabled:opacity-50 mt-2" 
            disabled={loading} 
            aria-label="Create account"
          >
            {loading ? "Creating Account..." : "Create Account \u2192"}
          </button>

          <p className="text-center text-xs font-medium text-slate-500 m-0 pt-2">
            Already have an account?{" "}
            <span 
              className="font-bold text-brand-600 hover:underline cursor-pointer" 
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;