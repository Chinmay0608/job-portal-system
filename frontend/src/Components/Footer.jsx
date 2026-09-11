import { Link } from "react-router-dom";
import SkillBridgeLogo from "./SkillBridgeLogo";

function Footer() {
  return (
    <footer className="bg-[#090d12] border-t border-white/10 py-6 px-4 sm:px-8 lg:px-12 text-slate-300 font-sans w-full">
      <div className="w-full max-w-[1380px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Brand Logo (Moved left) & Slogan */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 shrink-0">
          <Link to="/" className="inline-block" title="SkillBridge Home">
            <SkillBridgeLogo width={140} isDark={true} />
          </Link>
          <span className="hidden sm:inline text-white/20">|</span>
          <p className="text-xs text-slate-300 font-normal m-0 max-w-sm">
            Connecting talent and opportunity. Built for the next generation of work.
          </p>
        </div>

        {/* Center: Clearly Labeled Links with Headings & Crisp Visible Colors */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs">
          {/* Company Group */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">Company:</span>
            <Link to="/about" className="text-slate-100 hover:text-white font-medium transition-colors">About</Link>
            <Link to="/careers" className="text-slate-100 hover:text-white font-medium transition-colors">Careers</Link>
            <Link to="/blog" className="text-slate-100 hover:text-white font-medium transition-colors">Blog</Link>
            <Link to="/help-center" className="text-slate-100 hover:text-white font-medium transition-colors">Help Center</Link>
          </div>

          <span className="hidden xl:inline text-white/20">•</span>

          {/* Legal Group */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">Legal:</span>
            <Link to="/privacy-policy" className="text-slate-100 hover:text-white font-medium transition-colors">Privacy</Link>
            <Link to="/terms-of-use" className="text-slate-100 hover:text-white font-medium transition-colors">Terms</Link>
            <Link to="/cookie-policy" className="text-slate-100 hover:text-white font-medium transition-colors">Cookies</Link>
            <Link to="/security" className="text-slate-100 hover:text-white font-medium transition-colors">Security</Link>
          </div>
        </div>

        {/* Right: Social Icons & Copyright */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex gap-2">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 text-slate-200 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-500/10 transition-colors text-[11px] font-bold no-underline">𝕏</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 text-slate-200 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-500/10 transition-colors text-[11px] font-bold no-underline">in</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="flex items-center justify-center w-7 h-7 rounded-md border border-white/10 bg-white/5 text-slate-200 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-500/10 transition-colors text-[11px] font-bold no-underline">⌥</a>
          </div>
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">© 2026 SkillBridge</span>
        </div>

      </div>
    </footer>
  );
}

export default Footer;