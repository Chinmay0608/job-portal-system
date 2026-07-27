const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default || require("rate-limit-redis");
const Redis = require("ioredis");

const limiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
};

// Only use Redis if configured, otherwise it defaults to memory store
if (process.env.REDIS_URL) {
  const redisClient = new Redis(process.env.REDIS_URL);
  limiterOptions.store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
} else {
  console.warn("No REDIS_URL found. Falling back to in-memory rate limiting.");
}

const authLimiter = rateLimit(limiterOptions);

module.exports = {
  authLimiter,
};
