const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const { createTicket, getTicketsAdmin, updateTicketStatus } = require("../controllers/supportController");

router.post("/report", protect, upload.single("screenshot"), createTicket);
router.get("/tickets", protect, authorizeRoles("recruiter", "admin"), getTicketsAdmin);
router.patch("/tickets/:id", protect, authorizeRoles("recruiter", "admin"), updateTicketStatus);

module.exports = router;
