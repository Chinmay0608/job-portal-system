require("dotenv").config();
const connectDB = require("./config/db");
const Job = require("./models/job");
const { runGeminiScraper } = require("./services/geminiScraper");

const test = async () => {
  await connectDB();
  await Job.deleteMany({ description: /Extracted via Gemini AI/i });
  await runGeminiScraper();
  process.exit(0);
};

test();
