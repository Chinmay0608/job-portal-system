const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    targetRole: {
      type: String,
      enum: ["all", "candidate", "recruiter", "specific"],
      default: "specific",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Message title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [5000, "Content cannot exceed 5000 characters"],
    },
    priority: {
      type: String,
      enum: ["normal", "urgent", "announcement"],
      default: "normal",
      index: true,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sendEmailCopy: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user feed queries
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ targetRole: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);
