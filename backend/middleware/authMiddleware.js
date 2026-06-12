const jwt = require("jsonwebtoken");

/* ==========================
   AUTH PROTECTION
========================== */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    let token = authHeader;

    // Handle Bearer token
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ==========================
   ROLE AUTHORIZATION
========================== */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};