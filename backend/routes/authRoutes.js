const express = require("express");
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

const router = express.Router();

/* ==========================
   AUTH ROUTES
========================== */
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

/* ==========================
   PASSWORD RESET
========================== */
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

/* ==========================
   RESUME UPLOAD
========================== */
router.post("/upload-resume", protect, upload.single("resume"), uploadResume);

module.exports = router;