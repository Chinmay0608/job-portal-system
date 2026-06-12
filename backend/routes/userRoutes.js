const express =
  require("express");

const router =
  express.Router();

const {
  updateProfile,
} = require(
  "../controllers/userController"
);

const {
  protect,
  authorizeRoles,
} = require(
  "../middleware/authMiddleware"
);

const upload =
  require(
    "../middleware/multer"
  );

router.put(
  "/update-profile",

  protect,
  authorizeRoles("candidate", "recruiter"),

  upload.single(
    "resume"
  ),

  updateProfile
);

module.exports =
  router;