const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Job = require("../models/job");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Job.countDocuments();
  const active = await Job.countDocuments({ isActive: { $ne: false } });

  const domains = await Job.aggregate([
    { $group: { _id: "$providerMetadata.domain", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log("\n==================================================");
  console.log(`TOTAL JOBS IN DATABASE: ${total}`);
  console.log(`ACTIVE JOBS: ${active}`);
  console.log("==================================================");
  console.log("DOMAIN BREAKDOWN:");
  domains.forEach(d => {
    console.log(`  - ${d._id || "Unclassified"}: ${d.count} jobs`);
  });
  console.log("==================================================\n");

  process.exit(0);
}

check().catch(console.error);
