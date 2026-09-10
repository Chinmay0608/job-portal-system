const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// ─── GET /api/notifications ──────────────────────────────────────────────────
// Returns paginated notifications for the authenticated user, filtered by recipient
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const unreadOnly = req.query.unreadOnly === "true" || req.query.unreadOnly === true;

  const filter = { recipient: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const [notifications, totalCount, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name email role")
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
    unreadCount,
  });
});

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
// Lightweight endpoint for navbar badge counter
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});

// ─── PATCH /api/notifications/:id/read ──────────────────────────────────────
// Marks single notification as read, enforcing strict ownership
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid notification ID");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found or access denied");
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
});

// ─── PATCH /api/notifications/read-all ──────────────────────────────────────
// Marks all unread notifications as read for current user
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

// ─── DELETE /api/notifications/:id ──────────────────────────────────────────
// Deletes a single notification, enforcing strict ownership
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid notification ID");
  }

  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipient: userId,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found or access denied");
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
    deletedId: id,
  });
});

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
};
