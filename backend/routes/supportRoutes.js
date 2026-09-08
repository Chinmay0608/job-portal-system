const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const { createTicket, getTicketsAdmin, updateTicketStatus, deleteTicket } = require("../controllers/supportController");

router.post("/report", protect, upload.single("screenshot"), createTicket);
router.get("/tickets", protect, authorizeRoles("recruiter", "admin"), getTicketsAdmin);
router.patch("/tickets/:id", protect, authorizeRoles("recruiter", "admin"), updateTicketStatus);
router.delete("/tickets/:id", protect, authorizeRoles("recruiter", "admin"), deleteTicket);

module.exports = router;
