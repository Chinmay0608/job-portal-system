const express = require("express");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validationMiddleware");
const { protect, optionalAuth, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  deleteJob,
  updateJob,
  searchMasterSkills,
} = require("../controllers/jobController");

const router = express.Router();

/* ==========================
   PUBLIC ROUTES
========================== */
router.get("/", optionalAuth, getAllJobs);
router.get("/skills/search", searchMasterSkills);

/* ==========================
   CANDIDATE ROUTES
========================== */
router.get(
  "/recommended",
  protect,
  authorizeRoles("candidate"),
  getRecommendedJobs,
);

/* ==========================
   RECRUITER ROUTES
========================== */
router.get("/my-jobs", protect, authorizeRoles("recruiter"), getRecruiterJobs);
router.post(
  "/create",
  protect,
  authorizeRoles("recruiter"),
  [
    body("title")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Job title must be at least 3 characters"),
    body("company").trim().notEmpty().withMessage("Company is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("salary")
      .isFloat({ gt: 0 })
      .withMessage("Salary must be a positive number"),
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
