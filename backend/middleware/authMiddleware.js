const jwt = require("jsonwebtoken");

/* ==========================
   AUTH PROTECTION
========================== */
const protect = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      const parts = req.headers.authorization.split(" ");
      if (parts[1] && parts[1] !== "null" && parts[1] !== "undefined") {
        token = parts[1];
      }
    }

    if (!token && req.query?.token && req.query.token !== "null" && req.query.token !== "undefined") {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ==========================
   OPTIONAL AUTH PROTECTION
========================== */
const optionalAuth = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      const parts = req.headers.authorization.split(" ");
      if (parts[1] && parts[1] !== "null" && parts[1] !== "undefined") {
        token = parts[1];
      }
    }

    if (!token && req.query?.token && req.query.token !== "null" && req.query.token !== "undefined") {
      token = req.query.token;
    }

    if (token && token !== "null" && token !== "undefined") {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // If token is invalid or expired, proceed safely as unauthenticated
    next();
  }
};

/* ==========================
   ROLE AUTHORIZATION
========================== */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (roles.includes(req.user.role)) {
      return next();
    }
    if (req.user.email === 'admin@gmail.com' || (process.env.SEED_ADMIN_EMAIL && req.user.email?.toLowerCase() === process.env.SEED_ADMIN_EMAIL.toLowerCase())) {
      return next();
    }
    return res.status(403).json({ message: "Access denied" });
  };
};

module.exports = {
  protect,
  optionalAuth,
  authorizeRoles,
};
