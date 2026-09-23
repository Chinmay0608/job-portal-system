const csrfProtection = (req, res, next) => {
  // Exempt auth endpoints & system sync routes that cannot carry a Bearer token yet
  const exemptPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/google",
    "/api/auth/google/callback",
    "/api/auth/google-login",
    "/api/auth/refresh",
    "/api/jobs/internal-sync",
    "/api/health",
  ];
  if (exemptPaths.some((p) => req.path === p || req.path.startsWith(p + "/"))) {
    return next();
  }

  // Only protect state-changing methods
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    // Check if the request is using a Bearer token
    const hasBearer =
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer");

    // Standard cross-origin requests cannot easily set custom headers
    const hasCustomHeader =
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers["x-csrf-token"] ||
      req.headers["x-sync-secret"];

    if (!hasBearer && !hasCustomHeader) {
      return res.status(403).json({
        message:
          "CSRF validation failed. Missing Bearer token or custom CSRF header.",
      });
    }
  }

  next();
};

module.exports = csrfProtection;

