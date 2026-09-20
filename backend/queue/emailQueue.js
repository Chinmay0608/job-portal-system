const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");
const sendEmail = require("../utils/sendEmail");

const REDIS_URL = process.env.REDIS_URL;
let emailQueue = null;
let emailWorker = null;
let redisConnection = null;

const startEmailWindow = async () => {
  if (!REDIS_URL) {
    console.log("[Email Window] REDIS_URL not configured. Skipping BullMQ email worker.");
    return;
  }

  try {
    if (!redisConnection) {
      redisConnection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
    }

    if (!emailQueue) {
      emailQueue = new Queue("emailQueue", { connection: redisConnection });
    }

    if (!emailWorker) {
      emailWorker = new Worker(
        "emailQueue",
        async (job) => {
          console.log(`[Email Worker] Processing email job '${job.name}' for ${job.data?.to}`);
          const { to, subject, html } = job.data || {};
          if (to && subject && html) {
            await sendEmail(to, subject, html);
          }
        },
        { connection: redisConnection, autorun: true }
      );

      emailWorker.on("completed", (job) => {
        console.log(`[Email Worker] Job ${job.id} completed successfully.`);
      });

      emailWorker.on("failed", (job, err) => {
        console.error(`[Email Worker] Job ${job?.id} failed:`, err.message);
      });
    } else if (emailWorker.isPaused()) {
      await emailWorker.resume();
    }

    console.log("[Email Window] 🚀 BullMQ Email Worker started (00:00 - 02:00 daily window).");
  } catch (err) {
    console.error("[Email Window Error]:", err.message);
  }
};

const stopEmailWindow = async () => {
  try {
    if (emailWorker) {
      console.log("[Email Window] 🛑 Closing 2-hour email window. Pausing worker to save Redis tokens.");
      await emailWorker.pause();
    }
    if (redisConnection) {
      await redisConnection.quit();
      redisConnection = null;
    }
  } catch (err) {
    console.error("[Email Window Shutdown Error]:", err.message);
  }
};

const addEmailToQueue = async (name, data, opts) => {
  if (emailQueue) {
    return await emailQueue.add(name, data, opts);
  }
  // Direct fallback if queue is not active
  return await sendEmail(data.to, data.subject, data.html);
};

module.exports = {
  emailQueue: { add: addEmailToQueue },
  startEmailWindow,
  stopEmailWindow,
};

