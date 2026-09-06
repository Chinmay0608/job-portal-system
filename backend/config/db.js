const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const seedAdminUser = async () => {
  try {
    const User = require("../models/user");
    const adminEmail = "admin@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 12);
      await User.create({
        name: "System Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "recruiter",
      });
      console.log("[Dev Seed] Created default admin user (admin@gmail.com / admin123)");
    }
  } catch (err) {
    console.error("[Dev Seed Error] Failed to seed admin user:", err.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("MongoDB Connected");
    await seedAdminUser();
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

