import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, ShieldCheck, X } from "lucide-react";

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
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-[480px] z-[9999] animate-fade-in-up"
      role="region" 
      aria-label="Cookie Permission Banner"
    >
      <div className="bg-[#0f172a] text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-2xl backdrop-blur-lg flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Cookie size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide m-0">
                We Value Your Privacy & Transparency
              </h3>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} /> Privacy First Platform
              </span>
            </div>
          </div>

          <button
            onClick={handleEssentialOnly}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close and Accept Essential Only"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-300 leading-relaxed m-0">
          SkillBridge uses essential cookies and local storage to keep your account authenticated, secure your sessions, and maintain platform preferences. Learn more in our{" "}
          <Link 
            to="/cookie-policy" 
            className="text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link 
            to="/privacy-policy" 
            className="text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Privacy Policy
          </Link>.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-slate-800/80">
          <button
            onClick={handleEssentialOnly}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all cursor-pointer"
          >
            Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Accept All Cookies
          </button>
        </div>

      </div>
    </div>
  );
}

export default CookieConsentBanner;
