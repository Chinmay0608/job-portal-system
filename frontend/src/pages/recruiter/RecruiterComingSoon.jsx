import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../Services/authUtils";
import SkillBridgeLogo from "../../Components/SkillBridgeLogo";
import { 
  HiSparkles, 
  HiOutlineBriefcase, 
  HiOutlineUserGroup, 
  HiOutlineChartBar, 
  HiOutlineArrowLeftOnRectangle 
} from "react-icons/hi2";
import toast from "react-hot-toast";

export default function RecruiterComingSoon() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleNotify = () => {
    toast.success("Thank you! We will notify you when the Recruiter Suite launches.", {
      icon: "🚀",
      duration: 4000,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans">
      {/* Background decorative glow elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto z-10">
        <SkillBridgeLogo width={176} variant="dark" isDark={true} />
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold border border-slate-700/60 transition-all cursor-pointer"
        >
          <HiOutlineArrowLeftOnRectangle size={18} />
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full mx-auto text-center my-auto py-12 z-10 flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs sm:text-sm font-bold tracking-wide uppercase mb-6 animate-pulse">
          <HiSparkles size={16} />
          Recruiter Suite &mdash; Production Preview
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
          Enterprise Recruiting Tools <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Coming Soon to Production
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          We are upgrading the SkillBridge Recruiter Portal with AI candidate matching, automated requisition workflows, and direct talent pipeline analytics.
        </p>

        {/* Feature Teasers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left mb-10">
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-3">
              <HiSparkles size={20} />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">AI Candidate Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Instant stack &amp; skill relevance scoring for applicants.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <HiOutlineBriefcase size={20} />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Requisition Studio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">AI-assisted job description generator &amp; multi-board posting.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <HiOutlineUserGroup size={20} />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Talent Pipelines</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Kanban applicant tracking from application to offer letter.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <HiOutlineChartBar size={20} />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">Hiring Insights</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Funnel velocity, drop-off rates, and sourcing analytics.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleNotify}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/30 cursor-pointer active:scale-95"
          >
            Get Notified On Launch 🚀
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
          >
            Back to SkillBridge Home
          </button>
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-6xl w-full mx-auto text-center z-10 pt-6 border-t border-slate-800/80">
        <p className="text-xs text-slate-500 font-medium">
          &copy; 2026 SkillBridge Inc. Recruiter workspace feature flag is currently restricted to local development environments.
        </p>
      </div>
    </div>
  );
}
