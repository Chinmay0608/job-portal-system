const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = authHeader;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }

    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};