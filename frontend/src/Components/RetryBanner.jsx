import React from "react";

function RetryBanner({ message, onRetry, buttonText = "Retry" }) {
  return (
    <div className="flex items-center justify-between gap-3.5 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-xl ml-auto max-w-[440px] mt-3 mb-4 shadow-sm">
      <div className="text-xs sm:text-sm leading-snug font-medium">{message}</div>
      {onRetry && (
        <button
          type="button"
          className="bg-amber-800 text-white border-0 rounded-lg px-3.5 py-1.5 cursor-pointer font-bold text-xs whitespace-nowrap transition-all duration-200 hover:bg-amber-900 hover:-translate-y-0.5 active:translate-y-0"
          onClick={onRetry}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

export default RetryBanner;

