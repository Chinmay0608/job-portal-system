const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default || require("rate-limit-redis");
const Redis = require("ioredis");

// Initialize Redis client. For production, add REDIS_URL to env.
// For local testing, it defaults to localhost:6379
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

module.exports = {
  authLimiter,
};
