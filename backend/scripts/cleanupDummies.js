require("dotenv").config();
const connectDB = require("./config/db");
const Job = require("./models/job");

const cleanup = async () => {
  await connectDB();
  const res = await Job.deleteMany({
    applyUrl: { $regex: "google.com/search" },
  });
  console.log("Deleted " + res.deletedCount + " dummy jobs.");
  process.exit(0);
};

cleanup();
