const cron = require("node-cron");
const Job = require("../models/job");
const Redis = require("ioredis");

// Connect to Redis. Defaults to localhost for local testing.
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    // Attempt to acquire a distributed lock for 60 seconds.
    // 'NX' ensures it only sets the key if it doesn't already exist.
    // 'EX' 60 sets an expiration of 60 seconds.
    const lock = await redisClient.set("cron_jobCleanup_lock", "locked", "NX", "EX", 60);
    
    if (!lock) {
      console.log("[Job Cleanup] Lock acquired by another instance. Skipping run.");
      return;
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
  } catch (error) {
    console.error("[Job Cleanup] Error during cleanup:", error.message);
  }
});

console.log(
  "[Job Cleanup] Cron job initialized. Will run every night at midnight.",
);
