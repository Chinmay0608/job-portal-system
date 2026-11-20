const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default || require("rate-limit-redis");
const Redis = require("ioredis");

const limiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true, // Prevent Redis quota exhaustion from crashing auth routes
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
};

// Temporary fix: Only use Redis if explicitly enabled via ENABLE_REDIS=true, otherwise default to memory store
if (process.env.ENABLE_REDIS === "true" && process.env.REDIS_URL) {
  const redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000))
  });
  redisClient.on("error", (err) => {
    console.warn("[RateLimiter Redis Warning]", err.message);
  });
  limiterOptions.store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
} else {
  console.log("[RateLimiter] Using in-memory rate limiting (Redis bypassed).");
}

const authLimiter = rateLimit(limiterOptions);

module.exports = {
  authLimiter,
};
