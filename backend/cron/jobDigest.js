const cron = require("node-cron");
const { runJobDigest } = require("../services/jobDigestService");

const scheduleJobDigest = () => {
  // Every Monday at 9:00 AM server time.
  cron.schedule("0 9 * * 1", async () => {
    try {
      await runJobDigest();
    } catch (err) {
      console.error("[Job Digest] Run failed:", err.message);
    }
  });

  console.log("[Job Digest] Cron job initialized. Will run every Monday at 9:00 AM.");
};

module.exports = scheduleJobDigest;
