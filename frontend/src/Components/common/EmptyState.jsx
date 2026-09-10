import React from "react";
import { Link } from "react-router-dom";
import defaultSvg from "../../assets/undraw_work-chat_kw8x.svg";

/**
 * Standardized Empty State Component
 * Features unDraw SVG artwork, balanced microcopy, and accessible CTA buttons.
 */
export default function EmptyState({
  illustration = defaultSvg,
  icon: Icon,
  title = "No results found",
  description = "Try adjusting your search criteria or filters to find what you're looking for.",
  actionText,
  onAction,
  actionHref,
  actionIcon: ActionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-md mx-auto animate-in fade-in duration-200 ${className}`}
    >
      {/* Illustration / Icon Container */}
      <div className="mb-6 relative flex items-center justify-center">
        {illustration ? (
          <img
            src={illustration}
            alt=""
            aria-hidden="true"
            className="w-48 h-36 sm:w-56 sm:h-40 object-contain drop-shadow-sm select-none"
            loading="lazy"
          />
        ) : Icon ? (
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
            <Icon className="w-8 h-8" />
          </div>
        ) : null}
      </div>

      {/* Typography Hierarchy */}
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed max-w-sm mb-6">
        {description}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && (
          actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" />}
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" />}
              <span>{actionText}</span>
            </button>
          )
        )}

        {secondaryActionText && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all duration-150 min-h-[44px] focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <span>{secondaryActionText}</span>
          </button>
        )}
      </div>
    </div>
  );
}
