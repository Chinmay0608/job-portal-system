const express = require("express");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validationMiddleware");
const {
  updateProfile,
  changePassword,
  toggleSaveJob,
  getSavedJobs,
  extractSkills,
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
  authorizeRoles("candidate", "recruiter"),
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("phone")
      .optional()
      .trim()
      .isNumeric()
      .withMessage("Phone must be numeric"),
    body("companyWebsite")
      .optional()
      .trim()
      .isURL()
      .withMessage("Company website must be a valid URL"),
  ],
  validateRequest,
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

module.exports = router;
