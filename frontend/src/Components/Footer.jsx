import { useNavigate } from "react-router-dom";
import SkillBridgeLogo from "./SkillBridgeLogo";

function Footer() {
  const navigate = useNavigate();

  const delayedNavigate = (path) => {
    setTimeout(() => {
      navigate(path);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }, 500);
  };

  const handleJobNavigation = (type) => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login", { state: { redirectAfterLogin: "/candidate-dashboard", roleType: type } });
    } else {
      navigate("/candidate-dashboard", { state: { roleType: type } });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#090d12] border-t border-white/10 pt-8 pb-4 px-6 sm:px-12 lg:px-16 text-slate-300 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 pb-8 border-b border-white/10">
        {/* Brand Column */}
        <div className="flex-shrink-0 min-w-[200px]">
          <button className="bg-transparent border-0 p-0 cursor-pointer text-left block mb-3" onClick={() => delayedNavigate("/")}>
            <SkillBridgeLogo width={150} isDark={true} />
          </button>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[240px] mb-4">
            Connecting talent and opportunity.<br />Built for the next generation of work.
          </p>
          <div className="flex gap-2">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-brand-500 hover:border-brand-500/50 hover:bg-brand-500/10 transition-colors text-xs font-bold no-underline">𝕏</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-brand-500 hover:border-brand-500/50 hover:bg-brand-500/10 transition-colors text-xs font-bold no-underline">in</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-brand-500 hover:border-brand-500/50 hover:bg-brand-500/10 transition-colors text-xs font-bold no-underline">⌥</a>
          </div>
        </div>

        {/* Links Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12 flex-1 md:justify-end">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">For Candidates</div>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => handleJobNavigation("all")}>Browse Jobs</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => handleJobNavigation("remote")}>Remote Roles</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/salary-data")}>Salary Data</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/get-featured")}>Get Featured</button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">For Companies</div>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => navigate("/register", {state: { role: "recruiter" }, })}>Post a Job</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/ai-recruiting")}>AI Recruiting</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/register")}>Pricing</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/success-stories")}>Success Stories</button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">Company</div>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/about")}>About</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/blog")}>Blog</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/careers")}>Careers</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/help-center")}>Help Center</button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1">Legal</div>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/privacy-policy")}>Privacy Policy</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/terms-of-use")}>Terms of Use</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/cookie-policy")}>Cookie Policy</button>
            <button className="bg-transparent border-0 p-0 text-left text-xs text-slate-400 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/security")}>Security</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-4 text-center text-xs text-slate-500">
        <span>© 2026 SkillBridge. All rights reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;