const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getUserMessages,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getAdminSentMessages,
  searchRecipients,
} = require("../controllers/messageController");

// Admin routes
router.post("/send", protect, authorizeRoles("admin"), sendMessage);
router.get("/sent", protect, authorizeRoles("admin"), getAdminSentMessages);
router.get("/search-recipients", protect, authorizeRoles("admin"), searchRecipients);

// User inbox routes (all authenticated roles)
router.get("/unread-count", protect, getUnreadCount);
router.get("/my-messages", protect, getUserMessages);
router.route("/read-all").patch(protect, markAllAsRead).put(protect, markAllAsRead);
router.route("/:id/read").patch(protect, markAsRead).put(protect, markAsRead);

module.exports = router;
