import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Search,
  Briefcase,
  Bookmark,
  Mic,
  LifeBuoy,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Compass,
} from "lucide-react";

const TOUR_STEPS = [
  {
    target: "search-filters",
    title: "1. Search & Smart Filters 🔍",
    icon: Search,
    color: "from-blue-600 to-indigo-600",
    badge: "Discovery",
    content:
      "Quickly find matching roles by typing keywords, target job titles, or tech stacks. Use filters to narrow down by Location, Experience, Salary range, Employment Type, or Remote roles.",
  },
  {
    target: "recommended-toggle",
    title: "2. AI Job Recommendations 🤖",
    icon: Sparkles,
    color: "from-indigo-600 to-purple-600",
    badge: "AI Powered",
    content:
      "Switch between 'Recommended' and 'All Jobs'. Our AI recommendation engine continuously analyzes your profile skills, experience level, and field to surface the highest matching opportunities.",
  },
  {
    target: "job-feed",
    title: "3. Job Cards & Quick Actions 💼",
    icon: Briefcase,
    color: "from-purple-600 to-pink-600",
    badge: "Live Feed",
    content:
      "Browse live listings aggregated from top career portals & ATS platforms. Click any job card to view complete details, match percentages, required skills, and salary breakdown.",
  },
  {
    target: "job-details",
    title: "4. Detailed Description & 1-Click Apply ⚡",
    icon: Bookmark,
    color: "from-emerald-600 to-teal-600",
    badge: "Instant Apply",
    content:
      "Read structured job descriptions, save roles for later, or apply instantly. For internal roles, apply with your uploaded resume; for external listings, we auto-track your application status!",
  },
  {
    target: "voice-assistant",
    title: "5. Voice AI Assistant 'Dhruv' 🎙️",
    icon: Mic,
    color: "from-amber-500 to-orange-600",
    badge: "Voice Helper",
    content:
      "Need hands-free navigation or instant advice? Click the floating Voice AI button or use wake word 'Hey Dhruv' to ask questions, filter jobs, or summarize company profiles using voice.",
  },
  {
    target: "help-support",
    title: "6. Support & Feedback Widget 💬",
    icon: LifeBuoy,
    color: "from-sky-600 to-blue-700",
    badge: "Always Here",
    content:
      "Found an issue or need assistance? Click the bottom-right 'Report Issue' widget anytime to contact our support desk, submit screenshots, or request platform assistance.",
  },
];

export default function DashboardTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step?.icon || Sparkles;

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !step) return;
    const element = document.querySelector(`[data-tour="${step.target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
      // Gently scroll element into view if out of viewport
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect);
    }
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("has_seen_dashboard_tour_v1", "true");
    if (onClose) onClose();
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleFinish();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const progressPercent = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-sans">
      {/* Target Highlight Box overlay */}
      {targetRect && (
        <div
          className="absolute border-2 border-brand-500 shadow-[0_0_25px_rgba(37,99,235,0.4)] rounded-2xl pointer-events-none transition-all duration-300 ease-out hidden sm:block"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Main Tour Card Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-up">
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className={`h-full bg-gradient-to-r ${step.color} transition-all duration-300 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Card Header Banner */}
        <div className={`p-6 bg-gradient-to-r ${step.color} text-white relative flex items-start justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-xs border border-white/20 flex items-center justify-center">
              <StepIcon size={24} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 border border-white/20">
                {step.badge}
              </span>
              <h3 className="text-lg sm:text-xl font-black mt-1 tracking-tight leading-tight m-0 text-white">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/30 transition-all border-0 text-white cursor-pointer"
            aria-label="Close tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed font-medium m-0">
            {step.content}
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Compass size={14} className="text-brand-600" />
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <span className="text-[11px] text-slate-400">
              Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">→</kbd> to navigate
            </span>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer transition-colors px-2 py-1"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border-0 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all border-0 cursor-pointer flex items-center gap-1.5 bg-gradient-to-r ${step.color}`}
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    <span>Finish & Start Exploring</span>
                    <CheckCircle2 size={16} />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
