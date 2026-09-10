const mongoose = require("mongoose");
const Notification = require("../models/Notification");

/**
 * Reusable helper function to create in-app notifications
 * Silently catches errors to ensure primary business operations are never disrupted.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.recipient
 * @param {string|mongoose.Types.ObjectId} [params.sender=null]
 * @param {"application_status"|"interview_invite"|"job_alert"|"support_update"|"platform_announcement"|"security_alert"} params.type
 * @param {string} params.title
 * @param {string} params.message
 * @param {"low"|"normal"|"high"|"urgent"} [params.priority="normal"]
 * @param {string} [params.actionUrl=""]
 * @returns {Promise<Object|null>}
 */
const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  priority = "normal",
  actionUrl = "",
}) => {
  try {
    if (!recipient) {
      console.warn("[notify.js] Skipped notification: recipient is required.");
      return null;
    }

    if (!type || !title || !message) {
      console.warn("[notify.js] Skipped notification: missing required fields (type, title, message).");
      return null;
    }

    const doc = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title: String(title).trim().slice(0, 120),
      message: String(message).trim().slice(0, 1000),
      priority,
      actionUrl: String(actionUrl || "").trim(),
      isRead: false,
    });

    return doc;
  } catch (err) {
    console.error("[notify.js] Failed to create notification:", err.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
