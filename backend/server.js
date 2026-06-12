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
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL],
    credentials: true,
  })
);
app.use(express.json());

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