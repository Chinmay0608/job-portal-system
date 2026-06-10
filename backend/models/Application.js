const upload =
require(
  "../middleware/multer"
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
        required: false,
        default: "",
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