const cron = require("node-cron");
const Job = require("../models/job");
const Redis = require("ioredis");

// Only initialize Redis client if a URL is provided
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
}

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    // Attempt to acquire a distributed lock for 60 seconds if Redis is available.
    if (redisClient) {
      const lock = await redisClient.set("cron_jobCleanup_lock", "locked", "NX", "EX", 60);
      
      if (!lock) {
        console.log("[Job Cleanup] Lock acquired by another instance. Skipping run.");
        return;
      }
    } else {
      console.log("[Job Cleanup] Running without distributed lock (no REDIS_URL found).");
    }

    console.log("[Job Cleanup] Running automated job cleanup...");

    // Find jobs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Job.updateMany(
      {
        isExternal: true,
        isActive: { $ne: false },
        createdAt: { $lt: thirtyDaysAgo },
      },
      {
        $set: { isActive: false },
      },
    );

    console.log(
      `[Job Cleanup] Automatically marked ${result.modifiedCount} old external jobs as inactive.`,
    );

    // Find internal jobs older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const internalResult = await Job.updateMany(
      {
        isExternal: { $ne: true },
        isActive: { $ne: false },
        updatedAt: { $lt: ninetyDaysAgo },
      },
      {
        $set: { isActive: false },
      },
    );

    console.log(
      `[Job Cleanup] Automatically marked ${internalResult.modifiedCount} old internal jobs as inactive.`,
    );
  } catch (error) {
    console.error("[Job Cleanup] Error during cleanup:", error.message);
  }
});

console.log(
  "[Job Cleanup] Cron job initialized. Will run every night at midnight.",
);
