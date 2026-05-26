const express = require("express");

const {
  applyJob,
  getMyApplications,
} = require(
  "../controllers/applicationController"
);

const {
  protect,
  authorizeRoles,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.post(
  "/apply",
  protect,
  authorizeRoles("candidate"),
  applyJob
);

router.get(
  "/my-applications",
  protect,
  authorizeRoles("candidate"),
  getMyApplications
);

module.exports = router;