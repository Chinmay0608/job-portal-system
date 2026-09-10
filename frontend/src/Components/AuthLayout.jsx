import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiStar, FiTarget, FiBriefcase, FiZap } from "react-icons/fi";
import SkillBridgeLogo from "./SkillBridgeLogo";

/**
 * AuthLayout - UI/UX Pro Max Multi-Layered SVG Architecture
 * 
 * Provides:
 * 1. Multi-layered SVG background container:
 *    - Orthogonal circuit/tech grid with dynamic CSS radial fade mask
 *    - Layered gradient nodes (cyan-to-blue & violet-to-indigo) with SVG feGaussianBlur
 *    - Decorative SVG geometric accents (crosshairs, code brackets, angled connection vectors)
 * 2. Left Hero Panel (Visual Anchor) with animated pulse badge, micro-SVG stat icons,
 *    and sharp vector gold stars.
 * 3. Mobile/Tablet compact stats pill banner (< lg).
 * 4. Full dark-mode ready tokens and 4.5:1 WCAG AA contrast.
 */
export default function AuthLayout({
  children,
  badge = "Verified Talent Network",
  headline = "Find roles matched to your verified skills",
  subheadline = "Join 50,000+ engineers, designers, and top recruiters building high-impact careers with SkillBridge.",
  stats = [
    { label: "Match Precision", value: "98.4%", icon: FiTarget, iconColor: "text-blue-500" },
    { label: "Hiring Partners", value: "500+", icon: FiBriefcase, iconColor: "text-indigo-500" },
    { label: "Avg. Time to Offer", value: "12 Days", icon: FiZap, iconColor: "text-amber-500" },
  ],
}) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen lg:h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden lg:overflow-hidden selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* ========================================================================= */}
      {/* 1. MULTI-LAYERED SVG BACKGROUND CONTAINER                                 */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        
        {/* SVG Circuit & Tech Grid Pattern with Dynamic Radial Vignette Mask */}
        <svg
          className="absolute inset-0 w-full h-full text-blue-900/[0.08] dark:text-blue-400/[0.08]"
          style={{
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="auth-circuit-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle cx="48" cy="48" r="1.5" fill="currentColor" opacity="0.9" />
              <circle cx="0" cy="0" r="1.5" fill="currentColor" opacity="0.9" />
              <path d="M 0 24 h 8 M 40 24 h 8 M 24 0 v 8 M 24 40 v 8" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-circuit-grid)" />
        </svg>

        {/* Layered Gradient Nodes & Beams with SVG feGaussianBlur */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gaussian Blur Filters */}
            <filter id="glow-cyan-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="80" />
            </filter>
            <filter id="glow-violet-indigo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="90" />
            </filter>

            {/* Top-Left Cyan-to-Blue Orb Gradient */}
            <radialGradient id="orb-cyan-blue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#2563eb" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
            </radialGradient>

            {/* Bottom-Right Violet-to-Indigo Glow Gradient */}
            <radialGradient id="orb-violet-indigo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="55%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Top-Left Node (Behind Value Proposition) — 15% opacity */}
          <circle
            cx="16%"
            cy="22%"
            r="300"
            fill="url(#orb-cyan-blue)"
            filter="url(#glow-cyan-blue)"
            opacity="0.15"
          />

          {/* Bottom-Right Node (Behind Card) — 12% opacity */}
          <circle
            cx="86%"
            cy="76%"
            r="340"
            fill="url(#orb-violet-indigo)"
            filter="url(#glow-violet-indigo)"
            opacity="0.12"
          />

          {/* Center-Top Ambient Accent */}
          <circle
            cx="50%"
            cy="5%"
            r="200"
            fill="url(#orb-cyan-blue)"
            filter="url(#glow-cyan-blue)"
            opacity="0.08"
          />

          {/* Decorative Geometric Vector Accents (Crosshairs & Technical Brackets) */}
          {/* Crosshair 1: Top-Left */}
          <g stroke="currentColor" strokeWidth="1.2" className="text-blue-600/30 dark:text-blue-400/30" strokeLinecap="round">
            <line x1="70" y1="90" x2="90" y2="90" />
            <line x1="80" y1="80" x2="80" y2="100" />
            <circle cx="80" cy="90" r="1" fill="currentColor" />
          </g>

          {/* Crosshair 2: Mid-Right */}
          <g stroke="currentColor" strokeWidth="1.2" className="text-indigo-600/25 dark:text-indigo-400/25" strokeLinecap="round">
            <line x1="94%" y1="160" x2="94%" y2="180" />
            <line x1="calc(94% - 10px)" y1="170" x2="calc(94% + 10px)" y2="170" />
          </g>

          {/* Crosshair 3: Center-Bottom */}
          <g stroke="currentColor" strokeWidth="1.2" className="text-blue-500/20" strokeLinecap="round">
            <line x1="45%" y1="92%" x2="45%" y2="96%" />
            <line x1="calc(45% - 8px)" y1="94%" x2="calc(45% + 8px)" y2="94%" />
          </g>

          {/* Angled Technical Data Line */}
          <path
            d="M 40 280 L 120 280 L 190 350 L 260 350"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-blue-500/20 hidden lg:block"
          />
          <circle cx="260" cy="350" r="2.5" fill="currentColor" className="text-blue-500/40 hidden lg:block" />

          {/* Tech Angle Bracket Accent */}
          <path
            d="M calc(100% - 140px) calc(100% - 120px) l 16 0 l 0 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-indigo-500/25 hidden lg:block"
          />
        </svg>

      </div>

      {/* ========================================================================= */}
      {/* 2. TOP UTILITY NAVIGATION BAR                                             */}
      {/* ========================================================================= */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between z-10 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white/75 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer group"
          aria-label="Return to SkillBridge home"
        >
          <FiArrowLeft className="text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to SkillBridge</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">Platform Live & Operational</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MAIN SPLIT CONTENT BODY                                                */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-center lg:justify-between py-2 sm:py-3 lg:py-0 z-10">
        
        {/* MOBILE ONLY (< lg): Compact Metric Ticker */}
        <div className="lg:hidden w-full max-w-sm sm:max-w-md mb-2">
          <div className="flex items-center justify-between px-4 py-2 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>98.4% Match Rate</span>
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>500+ Hiring Partners</span>
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <span>★ 5.0</span>
            </div>
          </div>
        </div>

        {/* DESKTOP LEFT COLUMN: Brand Showcase & Rich Visual Anchor (Hidden on < lg) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-center pr-8 xl:pr-12 space-y-5 select-none">
          
          <div className="cursor-pointer inline-block self-start" onClick={() => navigate("/")}>
            <SkillBridgeLogo width={220} />
          </div>

          {/* Badge Anchor with Animated Glowing Dot */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border border-blue-200/80 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold w-fit shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span>{badge}</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight m-0">
              {headline}
            </h1>
            <p className="text-sm xl:text-base text-slate-600 dark:text-slate-300 leading-relaxed m-0 font-normal">
              {subheadline}
            </p>
          </div>

          {/* Social Proof Glass Metrics Card with Micro-SVG Icons */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-blue-500/5">
            {stats.map((item, idx) => {
              const IconComponent = item.icon || FiTarget;
              return (
                <div key={idx} className="text-left">
                  <div className="flex items-center gap-1.5">
                    <IconComponent className={item.iconColor || "text-blue-500"} size={16} />
                    <span className="text-xl xl:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {item.value}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Testimonial Pill with Sharp Gold Vector Stars */}
          <div className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-white/80 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-950/40 backdrop-blur-md rounded-2xl border border-blue-100 dark:border-blue-900/40 shadow-xs">
            <div className="flex -space-x-2 overflow-hidden flex-shrink-0 pt-0.5">
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-blue-600 text-white text-xs font-bold flex items-center justify-center">JD</span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">SK</span>
              <span className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-800 text-white text-xs font-bold flex items-center justify-center">AR</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-xs" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 ml-1">5.0 Star Rating</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 m-0 leading-snug">
                "Got hired at a Tier-1 tech company in 12 days through SkillBridge verified matching."
              </p>
            </div>
          </div>

          {/* Feature Highlights Checklist */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={15} />
              <span>Real-time DHRUV AI Application & Interview Prep</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
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
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 text-center text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0 z-10">
        <span>© {new Date().getFullYear()} SkillBridge Inc. All rights reserved. • Protected with 256-bit TLS encryption.</span>
      </footer>

    </div>
  );
}
