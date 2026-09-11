import { useState, useEffect } from "react";
import { Monitor, Copy, Check, X } from "lucide-react";
import { FaChrome, FaSafari } from "react-icons/fa";
import toast from "react-hot-toast";

const STORAGE_KEY = "skillbridge_desktop_advisory_dismissed";

function DesktopAdvisoryModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chrome"); // "chrome" | "safari"
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      try {
        const isDismissed = sessionStorage.getItem(STORAGE_KEY) === "true";
        if (!isDismissed && window.innerWidth < 768) {
          setIsOpen(true);
        } else if (window.innerWidth >= 768) {
          setIsOpen(false);
        }
      } catch {
        if (window.innerWidth < 768) setIsOpen(true);
      }
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setHasCopied(true);
      toast.success("Link copied! Paste it into Slack, WhatsApp, or Email to open on your PC.", {
        duration: 4000,
        icon: "💻",
      });
      setTimeout(() => setHasCopied(false), 3000);
    } catch {
      toast.error("Could not copy link automatically. You can copy the URL from your browser bar.");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-advisory-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col">
        
        {/* Top Decorative Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Visual Device Indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                Experience Advisory
              </span>
              <h2 id="desktop-advisory-title" className="text-lg font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                Desktop View Recommended
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            SkillBridge features rich split-screen job matching, resume analysis, and interactive recruiting tools designed for workstation displays.
          </p>

          {/* Browser Switching Instructions Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Switch in Mobile Browser:
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("chrome")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "chrome"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <FaChrome className="w-3.5 h-3.5" />
                  Chrome
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("safari")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "safari"
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <FaSafari className="w-3.5 h-3.5" />
                  Safari
                </button>
              </div>
            </div>

            {activeTab === "chrome" ? (
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>three dots (⋮)</strong> menu in the top-right corner of Chrome.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <span>Scroll down and check <strong>"Desktop site"</strong>.</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic pl-7">
                  Chrome will instantly reload this page in full desktop resolution.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>aA</strong> icon on the left side of your address bar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">2</span>
                  <span>Select <strong>"Request Desktop Website"</strong>.</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic pl-7">
                  Safari will automatically switch the layout to full desktop mode.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            >
              {hasCopied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Link Copied! Send to PC</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>Copy Link to Open on Laptop / PC</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
            >
              Continue on mobile anyway
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default DesktopAdvisoryModal;
