const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

/**
 * Custom Multer storage engine using Cloudinary v2 upload_stream.
 * Replaces multer-storage-cloudinary which only supports Cloudinary v1.
 */
const cloudinaryStorage = {
  _handleFile(req, file, cb) {
    let folder, resourceType, fileType;

    if (file.fieldname === "profileImage") {
      folder = "skillbridge/profile-images";
      resourceType = "image";
      fileType = "authenticated";
    } else if (file.fieldname === "screenshot") {
      folder = "skillbridge/support-screenshots";
      resourceType = "image";
      fileType = "upload";
    } else {
      // resume and anything else
      folder = "skillbridge/resumes";
      resourceType = "raw";
      fileType = "authenticated";
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: fileType,
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          filename: result.public_id,
          path: result.secure_url,
          size: result.bytes,
          // expose full result for downstream use
          cloudinary: result,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  },

  _removeFile(req, file, cb) {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename, cb);
    } else {
      cb(null);
    }
  },
};

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profileImage" || file.fieldname === "screenshot") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed for " + file.fieldname));
    }
  } else if (file.fieldname === "resume") {
    const allowedResumes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Wrap to inject our custom storage after memoryStorage buffers the file
const originalFields = upload.fields.bind(upload);
const originalSingle = upload.single.bind(upload);

/**
 * Returns a middleware that:
 *   1. Buffers the upload in memory (multer memoryStorage)
 *   2. Streams the buffer to Cloudinary v2
 */
function makeCloudinaryMiddleware(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) return next(err);
      if (!req.files && !req.file) return next();

      const files = req.file
        ? [{ key: "file", file: req.file }]
        : Object.entries(req.files).flatMap(([key, arr]) =>
            arr.map((f) => ({ key, file: f }))
          );

      try {
        for (const { file } of files) {
          await new Promise((resolve, reject) => {
            cloudinaryStorage._handleFile(req, file, (error, info) => {
              if (error) return reject(error);
              Object.assign(file, info);
              resolve();
            });
          });
        }
        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
}

module.exports = {
  single: (fieldname) =>
    makeCloudinaryMiddleware(originalSingle(fieldname)),
  fields: (fields) =>
    makeCloudinaryMiddleware(originalFields(fields)),
};
