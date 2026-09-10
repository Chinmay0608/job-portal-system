const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// All routes are role-agnostic but require authentication
router.use(protect);

router.get("/", getUserNotifications);
router.get("/unread-count", getUnreadCount);
router.route("/read-all").patch(markAllAsRead).put(markAllAsRead);
router.route("/:id/read").patch(markNotificationAsRead).put(markNotificationAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
