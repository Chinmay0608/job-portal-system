const express =
  require("express");

const upload =
require(
  "../middleware/uploadMiddleware"
);

const {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  deleteJob,
  applyJob,
  updateJob,
} = require(
  "../controllers/jobController"
);

const {
  protect,
  authorizeRoles,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();

router.get(
  "/",
  getAllJobs
);

router.get(
  "/my-jobs",
  protect,
  authorizeRoles(
    "recruiter"
  ),
  getRecruiterJobs
);

router.post(
  "/create",
  protect,
  authorizeRoles(
    "recruiter"
  ),
  createJob
);

router.delete(
  "/delete/:jobId",
  protect,
  authorizeRoles(
    "recruiter"
  ),
  deleteJob
);

router.put(
  "/update/:jobId",
  protect,
  authorizeRoles(
    "recruiter"
  ),
  updateJob
);

router.post(
  "/apply",
  protect,
  authorizeRoles(
    "candidate"
  ),
  upload.single(
    "resume"
  ),
  applyJob
);

module.exports = router;