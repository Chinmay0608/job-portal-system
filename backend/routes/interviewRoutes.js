const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  startInterviewSession,
  submitAnswer,
  getSessionHistory,
  getSessionDetails,
} = require("../controllers/interviewController");

/* ==========================================================================
   TRAO AI INTERVIEW ASSISTANT ROUTES (CANDIDATE ONLY)
   ========================================================================== */

router.post("/start", protect, authorizeRoles("candidate"), startInterviewSession);
router.post("/submit-answer", protect, authorizeRoles("candidate"), submitAnswer);
router.get("/history", protect, authorizeRoles("candidate"), getSessionHistory);
router.get("/session/:id", protect, authorizeRoles("candidate"), getSessionDetails);

module.exports = router;
