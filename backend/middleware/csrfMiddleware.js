const csrfProtection = (req, res, next) => {
  // Only protect state-changing methods
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    // Check if the request is using a Bearer token
    const hasBearer =
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer");

    // Standard cross-origin requests cannot easily set custom headers
    const hasCustomHeader =
      req.headers["x-requested-with"] === "XMLHttpRequest" ||
      req.headers["x-csrf-token"];

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
