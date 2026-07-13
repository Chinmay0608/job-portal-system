import React from "react";
import "../Styles/components/RetryBanner.css";

function RetryBanner({ message, onRetry, buttonText = "Retry" }) {
  return (
    <div className="retry-banner">
      <div className="retry-banner-message">{message}</div>
      {onRetry && (
        <button type="button" className="retry-banner-button" onClick={onRetry}>
          {buttonText}
        </button>
      )}
    </div>
  );
}

export default RetryBanner;
