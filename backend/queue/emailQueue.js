const { Queue, Worker } = require("bullmq");
const nodemailer = require("nodemailer");
const Redis = require("ioredis");

let emailQueue = null;

if (process.env.REDIS_URL) {
  const redisConnection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

  // Initialize Email Queue
  emailQueue = new Queue("emailQueue", { connection: redisConnection, stalledInterval: 300000, metrics: { maxDataPoints: 0 } });

  // Initialize Email Worker
  const emailWorker = new Worker(
    "emailQueue",
    async (job) => {
      const { to, subject, html } = job.data;

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
    { connection: redisConnection, stalledInterval: 300000, metrics: { maxDataPoints: 0 } }
  );

  emailWorker.on("completed", (job) => {
    console.log(`[Email Worker] Job ${job.id} has completed!`);
  });

  emailWorker.on("failed", (job, err) => {
    console.error(`[Email Worker] Job ${job.id} has failed with ${err.message}`);
  });
} else {
  console.warn("[Email Queue] No REDIS_URL found. Email queue is operating in stub mode.");
  
  // Provide a dummy queue for local environments without Redis
  emailQueue = {
    add: async (name, data, opts) => {
      console.log(`[Email Queue - Stub] Skipping sending email '${name}' to ${data?.to}`);
      return { id: `stub-${Date.now()}` };
    }
  };
}

module.exports = { emailQueue };

