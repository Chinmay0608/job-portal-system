const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log(
        "[Admin Seed] SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin seed."
      );
      return;
    }

    const User = require("../models/user");
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: "System Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "recruiter",
      });
      console.log(`[Admin Seed] Created admin user (${adminEmail}).`);
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

