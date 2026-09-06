const express = require("express");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validationMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
  toggleSaveJob,
  getSavedJobs,
  extractSkills,
  getSignedResumeUrl,
} = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

router.get("/profile", protect, getProfile);

/* ==========================
   UPDATE PROFILE
========================== */
router.put(
  "/update-profile",
  protect,
  authorizeRoles("candidate", "recruiter"),
  upload.fields([
    {
      name: "resume",
      maxCount: 1,
    },
    {
      name: "profileImage",
      maxCount: 1,
    },
  ]),
  [
    body("name").optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("phone").optional({ checkFalsy: true })
      .trim()
      .isNumeric()
      .withMessage("Phone must be numeric"),
    body("companyWebsite").optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage("Company website must be a valid URL"),
  ],
  validateRequest,
  updateProfile,
);

router.put(
  "/change-password",
  protect,
  authorizeRoles("candidate", "recruiter"),
  changePassword,
);

router.post(
  "/extract-skills",
  protect,
  authorizeRoles("candidate"),
  extractSkills,
);

router.post(
  "/saved-jobs/toggle",
  protect,
  authorizeRoles("candidate"),
  toggleSaveJob,
);

router.get("/saved-jobs", protect, authorizeRoles("candidate"), getSavedJobs);

router.get("/resume/:userId", protect, getSignedResumeUrl);

module.exports = router;
