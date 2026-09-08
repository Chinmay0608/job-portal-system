const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const {
  createTicket,
  getTicketsAdmin,
  updateTicketStatus,
  deleteTicket,
  getTicketLog,
} = require("../controllers/supportController");

// Reporter: submit a new ticket (must be authenticated)
router.post("/report", protect, upload.single("screenshot"), createTicket);

// Admin: list tickets with optional status / severity / category filters
router.get("/tickets", protect, authorizeRoles("admin"), getTicketsAdmin);

// Admin: update ticket status
router.patch("/tickets/:id", protect, authorizeRoles("admin"), updateTicketStatus);

// Admin: view the AI agent audit log for a specific ticket
router.get("/tickets/:id/log", protect, authorizeRoles("admin"), getTicketLog);

// Admin: delete a ticket
router.delete("/tickets/:id", protect, authorizeRoles("admin"), deleteTicket);

module.exports = router;
