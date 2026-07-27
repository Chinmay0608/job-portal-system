const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const { importJobsFromRemotive } = require("./services/jobFetcher");

const forceFetch = async () => {
  await connectDB();
  console.log("Starting forced bulk job import...");
  await importJobsFromRemotive();
  console.log("Forced job import complete.");
  process.exit(0);
};

forceFetch();
