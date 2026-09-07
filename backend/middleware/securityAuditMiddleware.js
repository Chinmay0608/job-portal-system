const SecurityLog = require("../models/SecurityLog");

const securityAudit = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    if ([401, 403, 429].includes(res.statusCode)) {
      const eventType =
        res.statusCode === 429
          ? "RATE_LIMIT_EXCEEDED"
          : "UNAUTHORIZED_ACCESS";

      const severity =
        res.statusCode === 403
          ? "HIGH"
          : res.statusCode === 429
          ? "HIGH"
          : "MEDIUM";

      const ipAddress =
        req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

      SecurityLog.create({
        eventType,
        severity,
        userEmail: req.user?.email || body?.email || "Anonymous",
        ipAddress,
        userAgent: req.headers["user-agent"] || "Unknown",
        endpoint: req.originalUrl || req.url,
        details: {
          statusCode: res.statusCode,
          message: body?.message || body?.error || "Access Denied",
          method: req.method,
        },
      }).catch((err) => {
        console.error("[SecurityLog] Failed to log security event:", err.message);
      });
    }

    return originalJson.call(this, body);
  };

  next();
};

const logSecurityEvent = async (eventType, severity, req, details = {}) => {
  try {
    const ipAddress =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    await SecurityLog.create({
      eventType,
      severity,
      userEmail: req.user?.email || details.targetEmail || "System Admin",
      ipAddress,
      userAgent: req.headers["user-agent"] || "Unknown",
      endpoint: req.originalUrl || req.url,
      details,
    });
  } catch (err) {
    console.error("[SecurityLog] Helper log error:", err.message);
  }
};

module.exports = {
  securityAudit,
  logSecurityEvent,
};
