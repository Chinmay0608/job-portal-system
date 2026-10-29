const express = require("express");
// FIX I-08: Split imports — getJobsAdmin now correctly imported from jobController,
// previously it was being destructured from "express-validator" which caused a TypeError on server startup.
const { body } = require("express-validator");
const validateRequest = require("../middleware/validationMiddleware");
const { protect, optionalAuth, authorizeRoles } = require("../middleware/authMiddleware");
const { cacheMiddleware } = require("../middleware/cacheMiddleware");
const {
  getJobsAdmin,
  createJob,
  generateJobDescription,
  getFullJobDescription,
  getEnglishJobDescription,
  aiCareerCoach,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  semanticSearchJobs,
  deleteJob,
  updateJob,
  hideJob,
  searchMasterSkills,
  triggerManualSync,
  triggerScheduledSync,
  getSyncStatus,
  getPublicStats,
} = require("../controllers/jobController");

const { submitAiFeedback } = require("../controllers/feedbackController");
const { synthesizeDhruvSpeech, createRealtimeScribeToken } = require("../controllers/speechController");
const rateLimit = require("express-rate-limit");


const router = express.Router();
const speechLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many voice requests. Please try again shortly." },
});
const translationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many translation requests. Please try again shortly." },
});

/* ==========================
   PUBLIC ROUTES
========================== */
// NOTE: GET /api/jobs is intentionally not cached.
// The response is personalized per-user (e.g. filtered by req.user.hiddenJobs),
// so caching by URL alone would leak hidden jobs across users or return stale data.
router.get("/", optionalAuth, getAllJobs);
router.get("/public-stats", cacheMiddleware(300), getPublicStats);
router.get("/semantic-search", optionalAuth, semanticSearchJobs);
router.get("/skills/search", cacheMiddleware(3600), searchMasterSkills);
router.get("/:id/full-description", optionalAuth, getFullJobDescription);
router.get("/:id/english-description", optionalAuth, translationLimiter, getEnglishJobDescription);

/* ==========================
   CANDIDATE ROUTES
========================== */
router.get(
  "/recommended",
  protect,
  authorizeRoles("candidate"),
  getRecommendedJobs,
);
router.post(
  "/ai/chat",
  protect,
  authorizeRoles("candidate"),
  aiCareerCoach,
);
router.post(
  "/ai/speech",
  protect,
  authorizeRoles("candidate"),
  speechLimiter,
  synthesizeDhruvSpeech,
);
router.post("/ai/transcribe-token", protect, authorizeRoles("candidate"), speechLimiter, createRealtimeScribeToken);
router.post(
  "/ai/feedback",
  protect,
  authorizeRoles("candidate"),
  submitAiFeedback,
);
router.post(
  "/ai-chat/feedback",
  protect,
  authorizeRoles("candidate"),
  submitAiFeedback,
);


router.post(
  "/hide/:jobId",
  protect,
  authorizeRoles("candidate"),
  hideJob,
);

/* ==========================
   ADMIN ROUTES
========================== */
router.get("/admin/all", protect, authorizeRoles("recruiter"), getJobsAdmin);
router.post("/sync", protect, authorizeRoles("recruiter"), triggerManualSync);
router.post("/internal-sync", triggerScheduledSync);
router.get("/sync/status", protect, authorizeRoles("recruiter"), getSyncStatus);

/* ==========================
   RECRUITER ROUTES
========================== */
router.get("/my-jobs", protect, authorizeRoles("recruiter"), getRecruiterJobs);

// AI Job Description Generator Route
router.post(
  "/generate-description",
  protect,
  authorizeRoles("recruiter", "admin"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("company").notEmpty().withMessage("Company is required"),
  ],
  validateRequest,
  generateJobDescription
);

router.post(
  "/create",
  protect,
  authorizeRoles("recruiter"),
  [
    body("title")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Job title must be at least 3 characters"),
    body("workplaceType").isIn(["On-site", "Hybrid", "Remote"]).withMessage("Select a workplace type"),
    body("experienceRequired").isIn(["Entry-level / Fresher", "Mid-level", "Senior", "Lead"]).withMessage("Select an experience level"),
    body("location").custom((value, { req }) => req.body.workplaceType === "Remote" || Boolean(String(value || "").trim())).withMessage("Location is required for on-site or hybrid jobs"),
    body("minSalary").optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage("Minimum salary must be non-negative"),
    body("maxSalary").optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage("Maximum salary must be non-negative"),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
  ],
  validateRequest,
  createJob,
);
router.put("/update/:jobId", protect, authorizeRoles("recruiter"), updateJob);
router.delete(
  "/delete/:jobId",
  protect,
  authorizeRoles("recruiter"),
  deleteJob,
);

module.exports = router;
