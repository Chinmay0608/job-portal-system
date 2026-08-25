// QUEUE DISABLED - Emails are now sent synchronously to save Redis commands on Upstash Free Tier
const { Queue } = require("bullmq");
const Redis = require("ioredis");

let emailQueue = null;

if (process.env.REDIS_URL) {
  const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  // Initialize Email Queue
  emailQueue = new Queue("emailQueue", { connection: redisConnection });
  // Worker intentionally disabled to save tokens.
} else {
  emailQueue = {
    add: async (name, data, opts) => {
      console.log(`[Email Queue - Stub] Skipping sending email '${name}' to ${data?.to}`);
      return { id: `stub-${Date.now()}` };
    }
  };
}

module.exports = { emailQueue };
