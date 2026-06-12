const express = require("express");
const { updateProfile } = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

/* ==========================
   UPDATE PROFILE
========================== */
router.put(
  "/update-profile",
  protect,
  authorizeRoles("candidate", "recruiter"),
  upload.single("resume"),
  updateProfile
);

module.exports = router;