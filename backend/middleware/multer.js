const multer = require("multer");

const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");

/* STORAGE */
const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    if (file.fieldname === "profileImage") {
      return {
        folder: "skillbridge/profile-images",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image",
        type: "authenticated",
      };
    }

    /* RESUME */
    return {
      folder: "skillbridge/resumes",
      allowed_formats: ["pdf", "doc", "docx"],
      resource_type: "raw",
      type: "authenticated",
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profileImage") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed for profile picture"));
    }
  } else if (file.fieldname === "resume") {
    const allowedResumes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowedResumes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed for resume"));
    }
  } else {
    cb(new Error("Unknown field name"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
