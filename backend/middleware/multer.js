const multer = require("multer");

const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");

/* STORAGE */
const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    /* PROFILE IMAGE */
    if (file.fieldname === "profileImage") {
      return {
        folder: "skillbridge/profile-images",

        allowed_formats: ["jpg", "jpeg", "png", "webp"],

        resource_type: "image",
      };
    }

    /* RESUME */
    return {
      folder: "skillbridge/resumes",

      allowed_formats: ["pdf", "doc", "docx"],

      resource_type: "raw",
    };
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
