const express = require("express");
const router = express.Router();
const { protect, optionalAuth, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const {
  createTicket,
  getMyTickets,
  getMyTicket,
  addTicketFollowUp,
  getTicketsAdmin,
  updateTicketStatus,
  deleteTicket,
  getTicketLog,
} = require("../controllers/supportController");

// Reporter: submit a new ticket (open to all: logged-in candidates, recruiters, and guests)
router.post("/report", optionalAuth, upload.single("screenshot"), createTicket);

// Reporter: view and add details to their own tickets
router.get("/my-tickets", protect, getMyTickets);
router.get("/my-tickets/:id", protect, getMyTicket);
router.post("/my-tickets/:id/messages", protect, addTicketFollowUp);

// Admin: list tickets with optional status / severity / category filters
router.get("/tickets", protect, authorizeRoles("admin"), getTicketsAdmin);

// Admin: update ticket status
router.patch("/tickets/:id", protect, authorizeRoles("admin"), updateTicketStatus);

// Admin: view the AI agent audit log for a specific ticket
router.get("/tickets/:id/log", protect, authorizeRoles("admin"), getTicketLog);

// Admin: delete a ticket
router.delete("/tickets/:id", protect, authorizeRoles("admin"), deleteTicket);

module.exports = router;
