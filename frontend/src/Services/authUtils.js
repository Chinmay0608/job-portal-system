import { logoutUserAPI } from "./authService";

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
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  // Prevent Mixed Content errors on HTTPS deployment (e.g., Vercel) if env variable is set to insecure http://
  if (typeof window !== "undefined" && window.location.protocol === "https:" && envUrl.startsWith("http://")) {
    return "";
  }
  return envUrl;
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};
