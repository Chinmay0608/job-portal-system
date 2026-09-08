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
  return 2; // Default starting demo count for candidate
};
