const express = require("express");
const upload = require("../middleware/multer");
const { protect } = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  uploadResume,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post(
  "/upload-resume",
  protect,
  upload.single("resume"),
  uploadResume
);

module.exports = router;