import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiStar } from "react-icons/fi";
import SkillBridgeLogo from "./SkillBridgeLogo";

/**
 * AuthLayout - UI/UX Pro Max Authentication Architecture
 * 
 * Provides:
 * 1. Layered Canvas with soft slate gradient base.
 * 2. High-depth ambient radial glows (blur-3xl) in top-left and bottom-right.
 * 3. Subtle dot-matrix pattern with elliptical radial mask.
 * 4. Responsive split-screen on large screens (lg:flex) showcasing social proof,
 *    live metrics, and value proposition alongside the focused form card.
 * 5. Optical centering on mobile/tablet viewports (< lg).
 */
export default function AuthLayout({
  children,
  badge = "AI-Powered Career Intelligence",
  headline = "Find roles matched to your verified skills",
  subheadline = "Join 50,000+ engineers, designers, and top recruiters building high-impact careers with SkillBridge.",
  stats = [
    { label: "Match Precision", value: "98.4%" },
    { label: "Hiring Partners", value: "500+" },
    { label: "Avg. Time to Offer", value: "12 Days" },
  ],
}) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen lg:h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 text-slate-900 font-sans flex flex-col justify-between overflow-x-hidden lg:overflow-hidden selection:bg-brand-500/20 selection:text-brand-900">
      
      {/* ========================================================================= */}
      {/* 1. ATMOSPHERIC CANVAS GLOWS & DOT MATRIX BACKGROUND LAYER                */}
      {/* ========================================================================= */}
      
      {/* Top-Left Ambient Blue/Indigo Glow */}
      <div 
        className="fixed -top-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none -z-10 transform-gpu"
        aria-hidden="true" 
      />
      
      {/* Bottom-Right Ambient Violet Glow */}
      <div 
        className="fixed -bottom-28 -right-28 w-[28rem] h-[28rem] bg-indigo-400/15 rounded-full blur-3xl pointer-events-none -z-10 transform-gpu"
        aria-hidden="true" 
      />

      {/* Center Subtle Sky Glow */}
      <div 
        className="fixed top-1/3 left-1/3 w-80 h-80 bg-sky-300/10 rounded-full blur-3xl pointer-events-none -z-10 transform-gpu"
        aria-hidden="true" 
      />

      {/* Subtle Dot Matrix with Radial Vignette Fade */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] -z-10"
        style={{
          backgroundImage: "radial-gradient(#0f172a 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 25%, rgba(0,0,0,0) 80%)",
        }}
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* 2. TOP UTILITY NAVIGATION BAR                                             */}
      {/* ========================================================================= */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between z-10 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white/90 backdrop-blur-sm border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer group"
          aria-label="Return to SkillBridge home"
        >
          <FiArrowLeft className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to SkillBridge</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">Platform Live & Operational</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN SPLIT CONTENT BODY                                                */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center lg:justify-between py-2 sm:py-3 lg:py-0 z-10">
        
        {/* DESKTOP LEFT COLUMN: Brand Showcase & Social Proof (Hidden on < lg) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-center pr-8 xl:pr-12 space-y-5 select-none">
          
          <div className="cursor-pointer inline-block self-start" onClick={() => navigate("/")}>
            <SkillBridgeLogo width={220} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold w-fit shadow-xs">
            <span>✨</span>
            <span>{badge}</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight m-0">
              {headline}
            </h1>
            <p className="text-sm xl:text-base text-slate-600 leading-relaxed m-0 font-normal">
              {subheadline}
            </p>
          </div>

          {/* Social Proof Stats Matrix */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_10px_30px_rgba(8,_112,_184,_0.04)]">
            {stats.map((item, idx) => (
              <div key={idx} className="text-left">
                <div className="text-xl xl:text-2xl font-black text-slate-900 tracking-tight">{item.value}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Verified Candidate Endorsement */}
          <div className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-white/80 to-blue-50/50 backdrop-blur-md rounded-2xl border border-blue-100 shadow-xs">
            <div className="flex -space-x-2 overflow-hidden flex-shrink-0 pt-0.5">
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-600 text-white text-xs font-bold flex items-center justify-center">JD</span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">SK</span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-800 text-white text-xs font-bold flex items-center justify-center">AR</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <FiStar key={i} className="fill-amber-400 text-amber-400" size={12} />
                ))}
                <span className="text-[11px] font-bold text-slate-700 ml-1">5.0 Star Rating</span>
              </div>
              <p className="text-slate-600 m-0 leading-snug">
                "Got hired at a Tier-1 tech company in 12 days through SkillBridge verified matching."
              </p>
            </div>
          </div>

          {/* Feature Highlights Checklist */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={15} />
              <span>Real-time DHRUV AI Application & Interview Prep</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={15} />
              <span>Zero recruiter spam — direct verified hiring channels</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Form Card (Centers on Mobile, Aligns on Desktop) */}
        <div className="w-full lg:w-1/2 xl:w-7/12 flex items-center justify-center lg:justify-end">
          {children}
        </div>

      </main>

      {/* ========================================================================= */}
      {/* 4. FOOTER COMPLIANCE BAR                                                  */}
      {/* ========================================================================= */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 text-center text-[11px] text-slate-400 flex-shrink-0 z-10">
        <span>© {new Date().getFullYear()} SkillBridge Inc. All rights reserved. • Protected with 256-bit TLS encryption.</span>
      </footer>

    </div>
  );
}
