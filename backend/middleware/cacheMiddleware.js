const Redis = require("ioredis");

// Default to in-memory cache behavior if no REDIS_URL is provided, 
// to prevent crashing environments without Redis.
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
}

/**
 * Middleware to cache API responses in Redis.
 * @param {number} duration Expiration time in seconds
 */
const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    // If Redis is not configured, skip caching
    if (!redisClient) {
      return next();
    }

    if (req.method !== "GET") {
      console.warn("Cannot cache non-GET methods!");
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      } else {
        // Intercept res.json to store the response in Redis before sending it
        res.originalJson = res.json;
        res.json = (body) => {
          // Only cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            redisClient.set(key, JSON.stringify(body), "EX", duration);
          }
          res.originalJson(body);
        };
        next();
      }
    } catch (error) {
      console.error("[Cache Error]", error);
      next(); // Proceed without caching if Redis errors out
    }
  };
};

/**
 * Clear cache for a specific prefix
 * @param {string} prefix 
 */
const clearCache = async (prefix) => {
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(`cache:${prefix}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`[Cache Cleared] Cleared keys starting with cache:${prefix}`);
    }
  } catch (error) {
    console.error("[Cache Clear Error]", error);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
};
