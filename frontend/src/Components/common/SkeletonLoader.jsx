import React from "react";

/**
 * Pulse-animated layout-matched skeletons to prevent Cumulative Layout Shift (CLS).
 */

export function JobCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 p-5 mb-3 shadow-sm animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 space-y-2">
          {/* Job Title */}
          <div className="h-5 bg-slate-200 rounded-md w-3/4" />
          {/* Company Name */}
          <div className="h-4 bg-slate-100 rounded-md w-1/3" />
        </div>
        {/* Bookmark action button placeholder */}
        <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
      </div>

      {/* Meta Pills (Location, Salary, Type) */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 bg-slate-100 rounded-md w-24" />
        <div className="h-6 bg-slate-100 rounded-md w-28" />
        <div className="h-6 bg-slate-100 rounded-md w-20" />
      </div>

      {/* Tag Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <div className="h-5 bg-blue-50 rounded-full w-20" />
        <div className="h-5 bg-slate-100 rounded-full w-16" />
        <div className="h-5 bg-slate-100 rounded-full w-24" />
        <div className="ml-auto h-3 bg-slate-100 rounded w-16" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b border-slate-100 animate-pulse">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-6 py-4">
          <div
            className={`h-4 bg-slate-200 rounded ${
              idx === 0 ? "w-32" : idx === 1 ? "w-44" : idx === 2 ? "w-24" : "w-16"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
        <div className="w-9 h-9 rounded-lg bg-slate-100" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-16 mb-3" />
      <div className="h-5 bg-slate-100 rounded-md w-28" />
    </div>
  );
}

export function SkeletonList({ count = 3, Component = JobCardSkeleton }) {
  return (
    <div className="w-full space-y-3" role="status" aria-label="Loading content...">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}

export default {
  JobCardSkeleton,
  TableRowSkeleton,
  MetricCardSkeleton,
  SkeletonList,
};
