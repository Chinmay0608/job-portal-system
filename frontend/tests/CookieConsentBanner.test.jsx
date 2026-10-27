// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CookieConsentBanner from "../src/Components/CookieConsentBanner.jsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("CookieConsentBanner", () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  const renderBanner = async () => {
    await act(async () => {
      root.render(createElement(MemoryRouter, null, createElement(CookieConsentBanner)));
    });
  };

  it("shows the consent dialog when no choice has been saved", async () => {
    await renderBanner();

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.activeElement.textContent).toBe("Accept All");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("migrates an existing choice and keeps the dialog hidden", async () => {
    localStorage.setItem("cookieConsent", "essential");
    await renderBanner();

    expect(localStorage.getItem("consent_choice")).toBe("essential");
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("saves the selected choice and closes the dialog after its transition", async () => {
    vi.useFakeTimers();
    await renderBanner();

    await act(async () => {
      container.querySelector(".consent-button-essential").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(localStorage.getItem("consent_choice")).toBe("essential");
    expect(container.querySelector(".consent-overlay").classList.contains("is-closing")).toBe(true);

    await act(async () => vi.advanceTimersByTime(180));

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});
