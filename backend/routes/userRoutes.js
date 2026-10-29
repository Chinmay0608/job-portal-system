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
  clearSkills,
  getSignedResumeUrl,
  completeOnboarding,
  completeRecruiterOnboarding,
} = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

router.get("/profile", protect, getProfile);

router.post(
  "/recruiter-onboarding",
  protect,
  authorizeRoles("recruiter"),
  upload.fields([{ name: "companyLogo", maxCount: 1 }]),
  completeRecruiterOnboarding,
);

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
    {
      name: "companyLogo",
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
      .matches(/^\+?[0-9\s().-]+$/)
      .withMessage("Phone may only contain digits, spaces, and + ( ) -")
      .bail()
      .custom((value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
      })
      .withMessage("Phone must contain between 7 and 15 digits"),
    body("companyWebsite").optional({ checkFalsy: true })
      .trim()
      .isURL({ protocols: ["http", "https"], require_protocol: false })
      .withMessage("Company website must be a valid URL"),
    body("linkedin").optional({ checkFalsy: true })
      .trim()
      .isURL({ protocols: ["http", "https"], require_protocol: false })
      .withMessage("LinkedIn must be a valid URL"),
    body("schedulingLink").optional({ checkFalsy: true })
      .trim()
      .isURL({ protocols: ["http", "https"], require_protocol: false })
      .withMessage("Interview booking link must be a valid URL"),
    body("companyIndustry").optional({ checkFalsy: true })
      .isIn(["Software / SaaS", "FinTech", "EdTech", "Healthcare", "E-Commerce", "Other"])
      .withMessage("Select a valid company industry"),
    body("companySize").optional({ checkFalsy: true })
      .isIn(["1-10", "11-50", "51-200", "201-500", "500+"])
      .withMessage("Select a valid company size"),
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

router.delete("/skills", protect, authorizeRoles("candidate"), clearSkills);

router.post(
  "/saved-jobs/toggle",
  protect,
  authorizeRoles("candidate"),
  toggleSaveJob,
);

router.get("/saved-jobs", protect, authorizeRoles("candidate"), getSavedJobs);

router.get("/resume/:userId", protect, getSignedResumeUrl);

router.post("/complete-onboarding", protect, completeOnboarding);

module.exports = router;
