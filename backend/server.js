require("dotenv").config();
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

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

/* ==========================
   DATABASE
========================== */
connectDB();

/* ==========================
   MIDDLEWARE
========================== */
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

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
  })
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

/* ==========================
   STATIC FILES
========================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ==========================
   ROUTES
========================== */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);

/* ==========================
   HEALTH CHECK
========================== */
app.get("/", (req, res) => {
  res.send("SkillBridge Backend Running 🚀");
});

/* ==========================
   SERVER & CRON
========================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start cron job to fetch external jobs every day at midnight (0 0 * * *)
  cron.schedule("0 0 * * *", () => {
    importAllExternalJobs();
  });
});