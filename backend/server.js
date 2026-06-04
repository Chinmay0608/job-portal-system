const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/db");

const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes =
  require("./routes/applicationRoutes");
const authRoutes = require("./routes/authRoutes");
const {
  protect,
  authorizeRoles,
} = require("./middleware/authMiddleware");

const app = express();

// Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically from /uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use(
  "/api/applications",
  applicationRoutes
);

app.get("/", (req, res) => {
  res.send("Job Portal Backend Running");
});

app.get("/profile", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

app.get(
  "/recruiter-dashboard",
  protect,
  authorizeRoles("recruiter"),
  (req, res) => {
    res.json({
      message: "Welcome Recruiter",
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});