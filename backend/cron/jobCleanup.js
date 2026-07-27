const cron = require("node-cron");
const Job = require("../models/job");

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
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
