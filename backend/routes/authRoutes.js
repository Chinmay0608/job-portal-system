const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validationMiddleware");
const upload = require("../middleware/multer");
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  uploadResume,
  googleLogin,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

const router = express.Router();

/* ==========================
   AUTH ROUTES
========================== */
router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["candidate", "recruiter"])
      .withMessage("Role must be either candidate or recruiter"),
  ],
  validateRequest,
  registerUser
);
router.post("/login", authLimiter, loginUser);
router.post("/google-login", googleLogin);

/* ==========================
   PASSWORD RESET
========================== */
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

/* ==========================
   RESUME UPLOAD
========================== */
router.post("/upload-resume", protect, upload.single("resume"), uploadResume);

module.exports = router;