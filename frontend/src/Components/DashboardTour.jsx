import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, BriefcaseBusiness, MapPin, Search, X } from "lucide-react";

const TOUR_STEPS = [
  {
    target: "search-filters",
    title: "Start with what you’re looking for",
    icon: Search,
    content: "Search by job title, skill, company, or location. You can explore opportunities across industries and experience levels.",
  },
  {
    target: "recommended-toggle",
    title: "Choose how to explore",
    icon: MapPin,
    content: "Browse all available roles, or switch to Recommended to see opportunities selected for your profile.",
  },
  {
    target: "job-feed",
    title: "Compare your options",
    icon: BriefcaseBusiness,
    content: "Review job cards to compare roles, workplaces, locations, and other details before deciding what fits.",
  },
  {
    target: "job-details",
    title: "Save a role or apply",
    icon: Bookmark,
    content: "Open a role to read the full description. Save it for later or apply when you’re ready.",
  },
];

export default function DashboardTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const element = document.querySelector(`[data-tour="${step.target}"]`);
    if (!element) {
      setTargetRect(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setTargetRect(rect.width && rect.height ? {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    } : null);
  }, [isOpen, step]);

  const finishTour = useCallback(() => {
    try {
      localStorage.setItem("has_seen_dashboard_tour_v1", "true");
    } catch {
      // The tour can still close if browser storage is unavailable.
    }
    onClose?.();
  }, [onClose]);

  const goNext = useCallback(() => {
    if (currentStep === TOUR_STEPS.length - 1) finishTour();
    else setCurrentStep((index) => index + 1);
  }, [currentStep, finishTour]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();
    const target = document.querySelector(`[data-tour="${step.target}"]`);
    if (target) {
      const rect = target.getBoundingClientRect();
      if (rect.width && rect.height && (rect.top < 12 || rect.bottom > window.innerHeight - 12)) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isOpen, step, updateTargetRect]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") finishTour();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") setCurrentStep((index) => Math.max(0, index - 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, finishTour, goNext]);

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="dashboard-tour-backdrop">
      {targetRect && (
        <div
          className="dashboard-tour-spotlight"
          aria-hidden="true"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      <section className="dashboard-tour-card" role="dialog" aria-modal="true" aria-labelledby="dashboard-tour-title" aria-describedby="dashboard-tour-description">
        <div className="dashboard-tour-progress" role="progressbar" aria-label={`Tour progress: step ${currentStep + 1} of ${TOUR_STEPS.length}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <header className="dashboard-tour-header">
          <div className="dashboard-tour-icon"><StepIcon size={21} aria-hidden="true" /></div>
          <div className="dashboard-tour-heading">
            <span>QUICK TOUR <i /> {String(currentStep + 1).padStart(2, "0")} / {String(TOUR_STEPS.length).padStart(2, "0")}</span>
            <h2 id="dashboard-tour-title">{step.title}</h2>
          </div>
          <button className="dashboard-tour-close" type="button" onClick={finishTour} aria-label="Close tour"><X size={19} /></button>
        </header>
        <div className="dashboard-tour-body">
          <p id="dashboard-tour-description">{step.content}</p>
          <div className="dashboard-tour-footer">
            <button className="dashboard-tour-skip" type="button" onClick={finishTour}>Skip tour</button>
            <div className="dashboard-tour-actions">
              {currentStep > 0 && <button className="dashboard-tour-back" type="button" onClick={() => setCurrentStep((index) => index - 1)}><ArrowLeft size={16} /> Back</button>}
              <button className="dashboard-tour-next" type="button" onClick={goNext}>
                {currentStep === TOUR_STEPS.length - 1 ? "Start exploring" : "Next"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
