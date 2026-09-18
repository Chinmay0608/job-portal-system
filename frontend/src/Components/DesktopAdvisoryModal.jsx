import { useState, useEffect } from "react";
import { Monitor, Copy, Check, X, Sparkles } from "lucide-react";
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
    } catch {
      // Ignore storage errors
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setHasCopied(true);
      toast.success("Link copied! Open on your Laptop or PC for the best experience.", {
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
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-advisory-title"
    >
      <div className="relative w-full max-w-md bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col text-left">
        
        {/* Top Decorative Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shrink-0" />

        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-0 transition-colors cursor-pointer z-20 flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-6 relative z-10 flex flex-col">
          
          {/* Header Title Section */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner mt-0.5">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="flex-1 pr-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Desktop Recommended
              </span>
              <h2 id="desktop-advisory-title" className="text-lg font-extrabold text-white tracking-tight mt-1 mb-0 leading-tight">
                Switch to Desktop View
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            SkillBridge includes advanced features like <strong>AI Career Co-pilot (DHRUV)</strong>, split-screen job matching, resume analysis, and interactive recruiting tools designed for workstation screens.
          </p>

          {/* Browser Switching Guide Card */}
          <div className="bg-slate-800/90 border border-slate-700/90 rounded-xl p-3.5 mb-4 shadow-inner">
            
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-700/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                How to switch in browser:
              </span>
              
              {/* Browser Toggle Tabs */}
              <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("chrome")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all border-0 cursor-pointer ${
                    activeTab === "chrome"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FaChrome className="w-3.5 h-3.5" />
                  Chrome
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("safari")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all border-0 cursor-pointer ${
                    activeTab === "safari"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FaSafari className="w-3.5 h-3.5" />
                  Safari
                </button>
              </div>
            </div>

            {/* Tab Instruction Content */}
            {activeTab === "chrome" ? (
              <div className="space-y-2.5 text-xs text-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span className="leading-snug">
                    Tap the <strong className="text-white bg-slate-700/60 px-1 py-0.5 rounded">three dots (⋮)</strong> menu in the top-right corner of Chrome.
                  </span>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="leading-snug">
                    Scroll down and check <strong className="text-white bg-slate-700/60 px-1 py-0.5 rounded">"Desktop site"</strong>.
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-blue-300 font-medium">
                  <Monitor className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                  <span>Chrome will reload the page in full desktop resolution.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span className="leading-snug">
                    Tap the <strong className="text-white bg-slate-700/60 px-1 py-0.5 rounded">aA</strong> icon on the left side of the address bar.
                  </span>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="leading-snug">
                    Select <strong className="text-white bg-slate-700/60 px-1 py-0.5 rounded">"Request Desktop Website"</strong>.
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-blue-300 font-medium">
                  <Monitor className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                  <span>Safari will reload the layout in full desktop view.</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white transition-all duration-200 shadow-lg border-0 cursor-pointer ${
                hasCopied 
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 active:scale-[0.99]"
              }`}
            >
              {hasCopied ? (
                <>
                  <Check className="w-4 h-4 text-white shrink-0" />
                  <span>Link Copied! Open on Laptop / PC</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white shrink-0" />
                  <span>Copy Link to Open on Laptop / PC</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer text-center"
            >
              Continue on mobile view
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default DesktopAdvisoryModal;
