const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log the error details with stack trace
  logger.error(err);

  // If the status code hasn't been set by the controller, default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message:
      statusCode === 500
        ? "Something went wrong, please try again"
        : err.message,
    // Provide stack trace only in development
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
