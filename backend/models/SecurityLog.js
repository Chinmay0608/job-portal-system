const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        "UNAUTHORIZED_ACCESS",
        "FAILED_LOGIN",
        "ROLE_CHANGE",
        "USER_DELETED",
        "JOB_DELETED",
        "RATE_LIMIT_EXCEEDED",
        "SUSPICIOUS_INPUT",
        "SYSTEM_CONFIG_CHANGE"
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    userEmail: {
      type: String,
      default: "Anonymous",
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      default: "Unknown",
    },
    endpoint: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ eventType: 1 });
securityLogSchema.index({ severity: 1 });

module.exports = mongoose.model("SecurityLog", securityLogSchema);
