import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle, Sparkles, Globe } from "lucide-react";

/**
 * Unified Status & Match Badge Component
 * WCAG AA Contrast Compliant (4.5:1 ratio against light card surfaces)
 */
export default function StatusBadge({
  status,
  score,
  skillsCount = 1,
  type = "status",
  label,
  size = "sm",
  showDot = true,
  className = "",
}) {
  // Size classes
  const sizeClasses = size === "md"
    ? "px-3 py-1 text-xs font-semibold gap-1.5"
    : "px-2.5 py-0.5 text-xs font-medium gap-1";

  // --- MATCH BADGE LOGIC ---
  if (type === "match") {
    const numericScore = typeof score === "number" ? Math.round(score) : 0;
    const hasRequirements = skillsCount > 0;

    // Requirement: Never render raw "0% match" on jobs with zero requirements
    if (numericScore <= 0 || !hasRequirements || numericScore < 30) {
      return (
        <span
          className={`inline-flex items-center rounded-full border bg-slate-100 text-slate-700 border-slate-200 font-medium ${sizeClasses} ${className}`}
          title="This position has open entry requirements"
        >
          <Globe className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>Open Requirements</span>
        </span>
      );
    }

    if (numericScore >= 80) {
      return (
        <span
          className={`inline-flex items-center rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold ${sizeClasses} ${className}`}
        >
          <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
          <span>{numericScore}% Match</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-semibold ${sizeClasses} ${className}`}
      >
        <Sparkles className="w-3 h-3 text-blue-600 flex-shrink-0" />
        <span>{numericScore}% Match</span>
      </span>
    );
  }

  // --- APPLICATION STATUS BADGE LOGIC ---
  const normalizedStatus = (status || "").toLowerCase().trim();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";
  let displayLabel = label || status || "Pending";

  switch (normalizedStatus) {
    case "applied":
    case "pending":
      styles = "bg-blue-50 text-blue-700 border-blue-200";
      dotColor = "bg-blue-500";
      displayLabel = label || "Applied";
      break;

    case "reviewed":
      styles = "bg-sky-50 text-sky-700 border-sky-200";
      dotColor = "bg-sky-500";
      displayLabel = label || "Under Review";
      break;

    case "shortlisted":
      styles = "bg-indigo-50 text-indigo-700 border-indigo-200";
      dotColor = "bg-indigo-500";
      displayLabel = label || "Shortlisted";
      break;

    case "interviewing":
    case "interview":
      styles = "bg-amber-50 text-amber-700 border-amber-200";
      dotColor = "bg-amber-500";
      displayLabel = label || "Interviewing";
      break;

    case "selected":
    case "hired":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
      dotColor = "bg-emerald-500";
      displayLabel = label || (normalizedStatus === "hired" ? "Hired" : "Selected");
      break;

    case "rejected":
      styles = "bg-rose-50 text-rose-700 border-rose-200";
      dotColor = "bg-rose-500";
      displayLabel = label || "Not Selected";
      break;

    case "withdrawn":
      styles = "bg-slate-100 text-slate-600 border-slate-200";
      dotColor = "bg-slate-400";
      displayLabel = label || "Withdrawn";
      break;

    default:
      if (status) {
        displayLabel = label || (status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " "));
      }
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${styles} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} aria-hidden="true" />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
