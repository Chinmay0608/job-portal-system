const upload =
require(
  "../middleware/uploadMiddleware"
);

const mongoose =
  require("mongoose");

const applicationSchema =
  new mongoose.Schema(
    {
      candidate: {
        type:
          mongoose.Schema
            .Types.ObjectId,
        ref: "User",
        required: true,
      },

      job: {
        type:
          mongoose.Schema
            .Types.ObjectId,
        ref: "Job",
        required: true,
      },

      /* NEW */
      resume: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "shortlisted",
          "rejected",
        ],
        default:
          "pending",
      },
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Application",
    applicationSchema
  );