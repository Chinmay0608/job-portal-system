const express =
  require("express");

const {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  deleteJob,
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

module.exports = router;