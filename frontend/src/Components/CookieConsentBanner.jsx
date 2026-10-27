import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./CookieConsentBanner.css";

const CONSENT_KEY = "consent_choice";

function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dialogRef = useRef(null);
  const acceptButtonRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    try {
      let choice = localStorage.getItem(CONSENT_KEY);
      // Keep existing visitors' saved choice when upgrading from the old banner.
      if (!choice) {
        const oldChoice = localStorage.getItem("cookieConsent");
        if (oldChoice === "essential" || oldChoice === "all") {
          localStorage.setItem(CONSENT_KEY, oldChoice);
          choice = oldChoice;
        }
      }
      if (choice !== "essential" && choice !== "all") setIsVisible(true);
    } catch {
      setIsVisible(true);
    }
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isVisible) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    acceptButtonRef.current?.focus();

    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const items = dialogRef.current?.querySelectorAll("button:not([disabled]), a[href]");
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", trapFocus);
    };
  }, [isVisible]);

  const saveConsent = (choice) => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // The dialog still closes if browser storage is unavailable.
    }
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setIsVisible(false);
      return;
    }
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => setIsVisible(false), 180);
  };

  if (!isVisible) return null;

  return (
    <div className={`consent-overlay${isClosing ? " is-closing" : ""}`}>
      <section
        className="consent-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="consent-decoration-circle" aria-hidden="true" />
        <div className="consent-decoration-dot" aria-hidden="true" />

        <header className="consent-header">
          <svg className="consent-shield" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r="36" fill="var(--butter)" />
            <path d="M36 17l14 5.5v10.5c0 8.6-5.7 15.4-14 17.5-8.3-2.1-14-8.9-14-17.5V22.5L36 17z" fill="var(--accent)" />
            <path d="M29.5 35.5l4.5 4.5 9-10" fill="none" stroke="var(--paper)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="15" cy="24" r="2" fill="var(--clay)" />
            <circle cx="57" cy="49" r="2" fill="var(--clay)" />
          </svg>
          <div className="consent-intro">
            <h2 id="consent-title">Your privacy matters</h2>
            <p>Here's the short version: we only keep what's needed to run your account, and nothing more.</p>
          </div>
        </header>

        <div className="consent-storage">
          <div className="consent-storage-label">Essential storage</div>
          <ul>
            {["Keeps you signed in", "Protects your account", "Remembers your choice"].map((item) => (
              <li key={item}>
                <svg viewBox="0 0 22 22" aria-hidden="true">
                  <circle cx="11" cy="11" r="11" fill="var(--check-bg)" />
                  <path d="M6.5 11.3l3 3 6-6.3" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="consent-no-tracking">
            <svg viewBox="0 0 22 22" aria-hidden="true">
              <circle cx="11" cy="11" r="11" fill="var(--dash-bg)" />
              <path d="M7 11h8" fill="none" stroke="var(--clay)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>No analytics or advertising cookies, for now</span>
          </div>
        </div>

        <div className="consent-actions">
          <button className="consent-button consent-button-essential" type="button" onClick={() => saveConsent("essential")}>
            Essential Only
          </button>
          <button className="consent-button consent-button-accept" type="button" ref={acceptButtonRef} onClick={() => saveConsent("all")}>
            Accept All
          </button>
        </div>

        <p className="consent-links">
          Read our <Link to="/cookie-policy">Cookie Policy</Link> and <Link to="/privacy-policy">Privacy Policy</Link>
        </p>
      </section>
    </div>
  );
}

export default CookieConsentBanner;
