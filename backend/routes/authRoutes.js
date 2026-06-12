const express =
  require("express");

const upload =
  require(
    "../middleware/multer"
  );

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  registerUser,
  loginUser,
  uploadResume,
  googleLogin,
  forgotPassword,
  resetPassword,
} = require(
  "../controllers/authController"
);

const router =
  express.Router();

router.post(
  "/register",
  registerUser
);

router.post(
  "/login",
  loginUser
);

router.post(
  "/google-login",
  googleLogin
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.put(
  "/reset-password/:token",
  resetPassword
);

router.post(
  "/upload-resume",
  protect,
  upload.single(
    "resume"
  ),
  uploadResume
);

module.exports =
  router;