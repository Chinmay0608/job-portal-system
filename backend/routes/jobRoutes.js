const express = require("express");

const {
  createJob,
  getAllJobs,
} = require("../controllers/jobController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllJobs);

router.post(
  "/create",
  protect,
  authorizeRoles("recruiter"),
  createJob
);

module.exports = router;