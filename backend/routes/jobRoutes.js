const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  deleteJob,
  updateJob,
  applyJob,
} = require("../controllers/jobController");

const router = express.Router();

/* ==========================
   PUBLIC ROUTES
========================== */
router.get("/", getAllJobs);

/* ==========================
   CANDIDATE ROUTES
========================== */
router.post(
  "/apply",
  protect,
  upload.single("resume"),
  applyJob
);

router.get(
  "/recommended",
  protect,
  authorizeRoles("candidate"),
  getRecommendedJobs
);

/* ==========================
   RECRUITER ROUTES
========================== */
router.get("/my-jobs", protect, authorizeRoles("recruiter"), getRecruiterJobs);
router.post("/create", protect, authorizeRoles("recruiter"), createJob);
router.put("/update/:jobId", protect, authorizeRoles("recruiter"), updateJob);
router.delete("/delete/:jobId", protect, authorizeRoles("recruiter"), deleteJob);

module.exports = router;