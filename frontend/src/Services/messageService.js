import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Authenticated Axios instance for messages
const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Event dispatch helper to synchronize message read counts across views & navbar
export const notifyMessagesUpdated = (unreadCount) => {
  try {
    window.dispatchEvent(
      new CustomEvent("skillbridge_official_messages_updated", {
        detail: { unreadCount },
      })
    );
  } catch (err) {
    console.warn("Could not dispatch messages updated event:", err);
  }
};

// ─── USER INBOX API (CANDIDATES & RECRUITERS) ────────────────────────────────

/**
 * Fetch inbox messages addressed to the current authenticated user or their role
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {boolean} [options.unreadOnly=false]
 */
export const getMyMessages = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  const res = await api.get(
    `/api/messages/my-messages?page=${page}&limit=${limit}&unreadOnly=${Boolean(unreadOnly)}`
  );
  if (res.data && typeof res.data.unreadCount === "number") {
    notifyMessagesUpdated(res.data.unreadCount);
  }
  return res.data;
};

/**
 * Marks a single message as read by the current user
 * @param {string} messageId
 */
export const markMessageAsRead = async (messageId) => {
  const res = await api.patch(
    `/api/messages/${messageId}/read`,
    {},
    { headers: { "x-requested-with": "XMLHttpRequest" } }
  );
  return res.data;
};

/**
 * Marks all incoming messages as read for the current user
 */
export const markAllMessagesAsRead = async () => {
  const res = await api.patch(
    "/api/messages/read-all",
    {},
    { headers: { "x-requested-with": "XMLHttpRequest" } }
  );
  notifyMessagesUpdated(0);
  return res.data;
};

/**
 * Retrieves the current unread count for badge indicators
 */
export const getUnreadCount = async () => {
  try {
    const res = await api.get("/api/messages/unread-count");
    const count = res.data?.unreadCount || 0;
    notifyMessagesUpdated(count);
    return count;
  } catch (err) {
    // Fallback if unread-count endpoint fails
    try {
      const fallback = await api.get("/api/messages/my-messages?limit=1");
      const count = fallback.data?.unreadCount || 0;
      notifyMessagesUpdated(count);
      return count;
    } catch {
      return 0;
    }
  }
};

// ─── BACKWARD COMPATIBILITY ALIASES ─────────────────────────────────────────
export const getUserMessagesAPI = (page = 1, limit = 20, unreadOnly = false) =>
  getMyMessages({ page, limit, unreadOnly });

export const markMessageAsReadAPI = (messageId) => markMessageAsRead(messageId);

export const markAllMessagesAsReadAPI = () => markAllMessagesAsRead();

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────
export const sendMessageAPI = async (messageData) => {
  const res = await api.post("/api/messages/send", messageData, {
    headers: { "x-requested-with": "XMLHttpRequest" },
  });
  return res.data;
};

export const getAdminSentMessagesAPI = async (page = 1, limit = 20) => {
  const res = await api.get(`/api/messages/sent?page=${page}&limit=${limit}`);
  return res.data;
};

export const searchRecipientsAPI = async (query) => {
  const res = await api.get(`/api/messages/search-recipients?q=${encodeURIComponent(query)}`);
  return res.data?.users || [];
};

// ─── LEGACY STORAGE STUB FOR BACKWARD COMPATIBILITY ─────────────────────────
export const STORAGE_KEY_PREFIX = "skillbridge_messages_v1_";

export const getUnreadMessagesCount = (user) => {
  try {
    const key = STORAGE_KEY_PREFIX + (user?._id || user?.email || "guest");
    const saved = localStorage.getItem(key);
    if (saved) {
      const convs = JSON.parse(saved);
      return convs.filter((c) => c.unread && !c.archived).length;
    }
  } catch (e) {
    console.error("Error reading unread count:", e);
  }
  return 0;
};
