import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Event dispatch helper to synchronize notification badges across Navbar & Drawers
export const notifyNotificationsUpdated = (unreadCount) => {
  try {
    window.dispatchEvent(
      new CustomEvent("skillbridge_notifications_updated", {
        detail: { unreadCount },
      })
    );
  } catch (err) {
    console.warn("Could not dispatch notifications updated event:", err);
  }
};

// ─── API CLIENT ENDPOINTS ───────────────────────────────────────────────────

/**
 * Fetch paginated in-app notifications for the authenticated user
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {boolean} [options.unreadOnly=false]
 */
export const getNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  const res = await api.get(
    `/api/notifications?page=${page}&limit=${limit}&unreadOnly=${Boolean(unreadOnly)}`
  );
  if (res.data && typeof res.data.unreadCount === "number") {
    notifyNotificationsUpdated(res.data.unreadCount);
  }
  return res.data;
};

/**
 * Mark a single notification as read
 * @param {string} id
 */
export const markAsRead = async (id) => {
  const res = await api.patch(
    `/api/notifications/${id}/read`,
    {},
    { headers: { "x-requested-with": "XMLHttpRequest" } }
  );
  return res.data;
};

/**
 * Mark all unread notifications as read for current user
 */
export const markAllAsRead = async () => {
  const res = await api.patch(
    "/api/notifications/read-all",
    {},
    { headers: { "x-requested-with": "XMLHttpRequest" } }
  );
  notifyNotificationsUpdated(0);
  return res.data;
};

/**
 * Delete a notification
 * @param {string} id
 */
export const deleteNotification = async (id) => {
  const res = await api.delete(`/api/notifications/${id}`);
  return res.data;
};

/**
 * Lightweight fetch of current unread notifications count
 */
export const getUnreadNotificationsCountAPI = async () => {
  try {
    const res = await api.get("/api/notifications/unread-count");
    const count = res.data?.unreadCount || 0;
    notifyNotificationsUpdated(count);
    return count;
  } catch {
    try {
      const fallback = await api.get("/api/notifications?limit=1");
      const count = fallback.data?.unreadCount || 0;
      notifyNotificationsUpdated(count);
      return count;
    } catch {
      return 0;
    }
  }
};

// ─── LEGACY STORAGE STUB FOR BACKWARD COMPATIBILITY ─────────────────────────
export const NOTIFICATIONS_STORAGE_KEY_PREFIX = "skillbridge_notifications_v1_";

export const INITIAL_NOTIFICATIONS_CANDIDATE = [];
export const INITIAL_NOTIFICATIONS_RECRUITER = [];

export const getUnreadNotificationsCount = (user) => {
  try {
    const key = NOTIFICATIONS_STORAGE_KEY_PREFIX + (user?._id || user?.email || "guest");
    const saved = localStorage.getItem(key);
    if (saved) {
      const notifs = JSON.parse(saved);
      return notifs.filter((n) => !n.read && !n.isRead).length;
    }
  } catch (e) {
    console.error("Error reading unread notifications count:", e);
  }
  return 0;
};
