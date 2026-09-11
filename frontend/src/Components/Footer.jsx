import { useNavigate } from "react-router-dom";
import SkillBridgeLogo from "./SkillBridgeLogo";

function Footer() {
  const navigate = useNavigate();

  const delayedNavigate = (path) => {
    setTimeout(() => {
      navigate(path);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }, 300);
  };

  return (
    <footer className="bg-[#090d12] border-t border-white/10 py-5 px-6 sm:px-12 lg:px-16 text-slate-300 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Slogan */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button className="bg-transparent border-0 p-0 cursor-pointer text-left block" onClick={() => delayedNavigate("/")}>
            <SkillBridgeLogo width={125} isDark={true} />
          </button>
          <span className="hidden sm:inline text-white/20">|</span>
          <p className="text-[11px] text-slate-400 font-medium m-0 text-center sm:text-left">
            Connecting talent and opportunity. Built for the next generation of work.
          </p>
        </div>

        {/* Reorganized Compact Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-400 font-medium">
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/about")}>About</button>
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/careers")}>Careers</button>
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/blog")}>Blog</button>
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/help-center")}>Help Center</button>
          <span className="hidden md:inline text-white/10">•</span>
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/privacy-policy")}>Privacy</button>
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/terms-of-use")}>Terms</button>
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/cookie-policy")}>Cookies</button>
          <button className="bg-transparent border-0 p-0 hover:text-white cursor-pointer transition-colors" onClick={() => delayedNavigate("/security")}>Security</button>
        </div>

        {/* Social Icons & Copyright */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="flex gap-1.5">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 text-slate-300 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-colors text-[11px] font-bold no-underline">𝕏</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 text-slate-300 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-colors text-[11px] font-bold no-underline">in</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 text-slate-300 hover:text-brand-400 hover:border-brand-500/50 hover:bg-brand-500/10 transition-colors text-[11px] font-bold no-underline">⌥</a>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">© 2026 SkillBridge</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;