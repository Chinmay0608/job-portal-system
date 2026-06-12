require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

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
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (
      origin,
      callback
    ) {

      if (!origin) {
        return callback(
          null,
          true
        );
      }

      const isVercel =
        origin.includes(
          ".vercel.app"
        );

      if (
        allowedOrigins.includes(
          origin
        ) ||
        isVercel
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,
  })
);

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
   SERVER
========================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});