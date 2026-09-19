import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) {
        // Subtle entrance delay after page mount
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage availability errors
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
    <aside
      className="fixed bottom-5 left-4 right-4 sm:right-auto sm:left-6 z-[9990] max-w-sm sm:max-w-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      aria-label="Cookie consent banner"
    >
      <div className="bg-slate-900/95 text-slate-200 border border-slate-800/90 shadow-2xl backdrop-blur-md rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white tracking-tight m-0">
            We value your privacy
          </h3>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer border-0 bg-transparent"
            title="Dismiss and use essential cookies only"
            aria-label="Dismiss cookie banner"
          >
            <X size={16} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed m-0">
          We use cookies and local storage to provide authentication, protect your account, and personalize your experience on SkillBridge. You can review our{" "}
          <Link
            to="/cookie-policy"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
          >
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy-policy"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>

        {/* Button Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer border-0"
          >
            Accept All
          </button>
        </div>
      </div>
    </aside>
  );
}

export default CookieConsentBanner;
