require("dotenv").config();
const connectDB = require("./config/db");
const Job = require("./models/job");

const test = async () => {
  await connectDB();
  const jobs = await Job.find({ description: { $regex: "Gemini" } });
  console.log(JSON.stringify(jobs, null, 2));
  process.exit(0);
};

test();
