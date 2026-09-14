require("dotenv").config();

// Process-level crash prevention and diagnostics
process.on("uncaughtException", (err) => {
  console.error("[Fatal Uncaught Exception]:", err.message, err.stack);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Promise Rejection]:", reason);
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const cron = require("node-cron");
const connectDB = require("./config/db");
const { importAllExternalJobs } = require("./services/jobFetcher");
require("./cron/jobCleanup");
require("./cron/jobDigest")();

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const supportRoutes = require("./routes/supportRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const errorHandler = require("./middleware/errorHandler");
const csrfProtection = require("./middleware/csrfMiddleware");
const { securityAudit } = require("./middleware/securityAuditMiddleware");

const app = express();

// Trust reverse proxy for rate-limiting behind Render/Vercel
app.set("trust proxy", 1);

/* ==========================
   DATABASE
========================== */
// Connection happens before starting the server below

/* ==========================
   MIDDLEWARE
========================== */
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with", "x-csrf-token", "x-sync-secret"],
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body, { replaceWith: "_" });
  mongoSanitize.sanitize(req.params, { replaceWith: "_" });
  mongoSanitize.sanitize(req.query, { replaceWith: "_" });
  next();
});

// Apply CSRF Protection & Security Audit Monitoring
app.use(csrfProtection);
app.use(securityAudit);

/* ==========================
   STATIC FILES
========================== */
// Legacy uploads route removed for security.

/* ==========================
   ROUTES
========================== */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

/* ==========================
   HEALTH CHECK
========================== */
const queueManager = require('./services/sde/queues');

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    sdeOnline: queueManager.isOnline || false,
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  const sdeStatus = queueManager.isOnline ? "ONLINE" : "OFFLINE";
  res.send(`SkillBridge Backend Running 🚀 | SDE: ${sdeStatus}`);
});

app.use(errorHandler);

/* ==========================
   SERVER & CRON
========================== */
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Import Config and new Sync Engine
    const jobAggConfig = require("./config/jobAggregation");
    const syncService = require("./services/sync.service");

    // Start Telegram Operations & Ticket Bot Poller
    const { startTelegramBot } = require("./services/telegramBot");
    startTelegramBot().catch((err) =>
      console.warn("[TelegramBot] Error starting poller:", err.message)
    );

    // BullMQ Email Queue Daily 1-Hour Window (Runs every night from 00:00 AM to 01:00 AM to save Redis tokens)
    cron.schedule("0 0 * * *", async () => {
      console.log("[Email Daily Window] 🚀 Opening 1-hour BullMQ Email worker window (00:00 - 01:00 AM)...");
      try {
        const { startEmailWindow, stopEmailWindow } = require("./queue/emailQueue");
        await startEmailWindow();

        // Schedule automatic window close after 1 hour (3,600,000 ms)
        setTimeout(async () => {
          console.log("[Email Daily Window] 🛑 Closing BullMQ Email worker window after 1 hour.");
          await stopEmailWindow();
        }, 60 * 60 * 1000);
      } catch (err) {
        console.error("[Email Daily Window Error]:", err.message);
      }
    });

    // SDE BullMQ Crawler Daily 1-Hour Window (Runs every night from 2:00 AM to 3:00 AM to save Redis tokens)
    cron.schedule("0 2 * * *", async () => {
      console.log("[SDE Daily Window] 🚀 Opening 1-hour BullMQ SDE crawler window (2:00 AM - 3:00 AM)...");
      try {
        await queueManager.initialize();
        if (queueManager.isOnline) {
          const crawlerWorker = require('./services/sde/workers/crawlerWorker');
          crawlerWorker.start();

          const scheduler = require('./services/sde/scheduler');
          await scheduler.sweep();

          // Schedule automatic window close in 1 hour (3,600,000 ms)
          setTimeout(async () => {
            console.log("[SDE Daily Window] 🛑 Closing BullMQ SDE crawler window after 1 hour. Pausing workers to save Redis tokens.");
            if (crawlerWorker.worker) {
              await crawlerWorker.worker.pause();
            }
            if (queueManager.connection) {
              await queueManager.connection.quit();
              queueManager.isOnline = false;
            }
          }, 60 * 60 * 1000);
        }
      } catch (err) {
        console.error("[SDE Daily Window Error]:", err.message);
      }
    });

    // unified cron interval from config
    cron.schedule(jobAggConfig.syncInterval, async () => {
      if (jobAggConfig.useNewSyncEngine) {
        console.log("[Cron] Running NEW Job Aggregation Sync Engine...");
        await syncService.runAllSync();
      } else {
        console.log("[Cron] Running LEGACY Job Fetcher...");
        importAllExternalJobs();
      }
    });
  });
});

