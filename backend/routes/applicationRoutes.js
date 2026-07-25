const express = require("express");
const {
  applyJob,
  applyExternal,
  getMyApplications,
  getRecruiterApplications,
  getRecruiterStats,
  updateApplicationStatus,
  withdrawApplication,
} = require("../controllers/applicationController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

/* ==========================
   CANDIDATE ROUTES
========================== */
router.post("/apply", protect, authorizeRoles("candidate"), upload.single("resume"), applyJob);
router.post("/apply-external", protect, authorizeRoles("candidate"), applyExternal);
router.get("/my-applications", protect, authorizeRoles("candidate"), getMyApplications);
router.delete("/:applicationId", protect, authorizeRoles("candidate"), withdrawApplication);

/* ==========================
   RECRUITER ROUTES
========================== */
router.get("/recruiter-applications", protect, authorizeRoles("recruiter"), getRecruiterApplications);
router.get("/recruiter-stats", protect, authorizeRoles("recruiter"), getRecruiterStats);
router.patch("/update/:applicationId", protect, authorizeRoles("recruiter"), updateApplicationStatus);

module.exports = router;