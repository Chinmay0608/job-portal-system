const multer =
  require("multer");

const cloudinary =
  require(
    "../config/cloudinary"
  );

const storage =
  require(
    "multer-storage-cloudinary"
  )({
    cloudinary:
      cloudinary,

    folder:
      "skillbridge_resumes",

    allowedFormats:
      ["pdf"],

    resource_type:
      "raw",
  });

const upload =
  multer({
    storage,
  });

module.exports =
  upload;