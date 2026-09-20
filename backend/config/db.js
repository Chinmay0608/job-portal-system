const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const seedAdminUser = async () => {
  try {
    const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

    const User = require("../models/user");
    const existingAdmin = await User.findOne({ email: adminEmail }).select("+password");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: "System Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "recruiter",
      });
      console.log(`[Admin Seed] Created admin user (${adminEmail}).`);
    } else {
      const isMatch = await bcrypt.compare(adminPassword, existingAdmin.password || "");
      if (!isMatch) {
        existingAdmin.password = await bcrypt.hash(adminPassword, 12);
        await existingAdmin.save();
        console.log(`[Admin Seed] Synchronized admin credentials for (${adminEmail}).`);
      }
    }
  } catch (err) {
    console.error("[Admin Seed Error] Failed to seed admin user:", err.message);
  }
};

const connectDB = async () => {
  try {
    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB Runtime Error]:", err.message);
    });

    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected");
    await seedAdminUser();
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

