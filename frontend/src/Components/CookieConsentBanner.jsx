import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck, X, Check } from "lucide-react";

function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) {
        // Delay showing banner slightly so splash screen / page load settles smoothly
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback if localStorage is restricted
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("cookieConsent", "all");
      localStorage.setItem("cookieConsentDate", new Date().toISOString());
    } catch {
      // Ignore storage errors
    }
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem("cookieConsent", "essential");
      localStorage.setItem("cookieConsentDate", new Date().toISOString());
    } catch {
      // Ignore storage errors
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-[460px] z-[9999] transition-all duration-300 animate-fade-in-up"
      role="region" 
      aria-label="Cookie and Privacy Consent Banner"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/70 shadow-2xl shadow-black/60 p-4 sm:p-5 text-slate-100 flex flex-col gap-3.5">
        
        {/* Glow ambient background accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Cookie size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight m-0 flex items-center gap-1.5">
                Cookie & Privacy Choices
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} /> Privacy First & Encrypted
              </span>
            </div>
          </div>

          <button
            onClick={handleEssentialOnly}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer border-0 bg-transparent"
            title="Dismiss and Accept Essential Only"
            aria-label="Dismiss cookie banner"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-300 leading-relaxed m-0 relative z-10">
          SkillBridge uses essential cookies and local storage for authentication, security, and preference management. We respect your data. Read our{" "}
          <Link 
            to="/cookie-policy" 
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-semibold transition-colors"
          >
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link 
            to="/privacy-policy" 
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-semibold transition-colors"
          >
            Privacy Policy
          </Link>.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80 relative z-10">
          <button
            onClick={handleEssentialOnly}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer shadow-sm active:scale-98"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
          >
            <Check size={13} className="stroke-[3]" />
            Accept All
          </button>
        </div>

      </div>
    </div>
  );
}

export default CookieConsentBanner;
