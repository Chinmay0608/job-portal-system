const { Queue, Worker } = require("bullmq");
const nodemailer = require("nodemailer");

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  // Parse the redis URL if available
};

// If a REDIS_URL is provided, we can pass it directly. BullMQ takes connection options or an IORedis instance.
// For simplicity, passing IORedis instance if REDIS_URL exists:
const Redis = require("ioredis");
const redisConnection = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({ host: "localhost", port: 6379, maxRetriesPerRequest: null });

// Initialize Email Queue
const emailQueue = new Queue("emailQueue", { connection: redisConnection });

// Initialize Email Worker
const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { to, subject, html } = job.data;

    // Move the transporter logic here so it only spins up in the worker process
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `SkillBridge <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    console.log(`[Email Worker] Sending email to ${to} for subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Worker] Email sent to ${to}: ${info.response}`);
    return info;
  },
  { connection: redisConnection }
);

emailWorker.on("completed", (job) => {
  console.log(`[Email Worker] Job ${job.id} has completed!`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Email Worker] Job ${job.id} has failed with ${err.message}`);
});

module.exports = { emailQueue };
