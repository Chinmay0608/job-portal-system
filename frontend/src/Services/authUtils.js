import { logoutUserAPI } from "./authService";

export const logoutUser = async () => {
  try {
    await logoutUserAPI();
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};
