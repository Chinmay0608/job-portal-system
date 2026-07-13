const express = require("express");
const {
  updateProfile,
  toggleSaveJob,
  getSavedJobs,
} = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

/* ==========================
   UPDATE PROFILE
========================== */
router.put(
  "/update-profile",
  protect,
  authorizeRoles(
    "candidate",
    "recruiter"
  ),

  upload.fields([
    {
      name: "resume",
      maxCount: 1,
    },
    {
      name:
        "profileImage",
      maxCount: 1,
    },
  ]),

  updateProfile
);

router.post(
  "/saved-jobs/toggle",
  protect,
  authorizeRoles("candidate"),
  toggleSaveJob
);

router.get(
  "/saved-jobs",
  protect,
  authorizeRoles("candidate"),
  getSavedJobs
);

module.exports = router;