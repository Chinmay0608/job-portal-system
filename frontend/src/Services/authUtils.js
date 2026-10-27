import { logoutUserAPI } from "./authService";

export const CANDIDATE_WELCOME_DISMISSED_KEY = "candidate_welcome_dismissed";
export const DHRUV_MIC_ACCESS_NOTICE_KEY = "dhruv_mic_access_notice_shown";

export const notifyAuthChanged = () => {
  try {
    window.dispatchEvent(new Event("skillbridge_auth_changed"));
  } catch (err) {
    console.warn("Could not dispatch auth changed event:", err);
  }
};

export const logoutUser = async () => {
  try {
    await logoutUserAPI();
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("last_google_email");
    localStorage.removeItem(CANDIDATE_WELCOME_DISMISSED_KEY);
    localStorage.removeItem(DHRUV_MIC_ACCESS_NOTICE_KEY);
    notifyAuthChanged();
  }
};

export const setStoredUser = (user, token) => {
  try {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    if (token !== undefined) {
      if (token) {
        localStorage.setItem("token", token);
        localStorage.removeItem(CANDIDATE_WELCOME_DISMISSED_KEY);
        localStorage.removeItem(DHRUV_MIC_ACCESS_NOTICE_KEY);
      } else {
        localStorage.removeItem("token");
      }
    }
  } catch (error) {
    console.error("Error setting stored user:", error);
  } finally {
    notifyAuthChanged();
  }
};

export const getApiBaseUrl = () => {
  const rawUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  const fallbackBase = typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://skillbridge-api.onrender.com";

  let envUrl = rawUrl;

  if (envUrl) {
    envUrl = envUrl.replace(/\/+$/, "");

    // Accept either a raw backend origin or a value already ending with /api.
    // All API callers append /api/..., so normalize both shapes to the origin.
    if (/\/api$/i.test(envUrl)) {
      envUrl = envUrl.slice(0, -4);
    }
  }

  const normalizedUrl = envUrl || fallbackBase;

  // Prevent Mixed Content errors on HTTPS deployments when an insecure localhost URL is configured.
  if (typeof window !== "undefined" && window.location.protocol === "https:" && normalizedUrl.startsWith("http://")) {
    return "";
  }

  return normalizedUrl;
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};
