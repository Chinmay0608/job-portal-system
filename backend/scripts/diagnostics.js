#!/usr/bin/env node
/**
 * Generic Database Diagnostics & Reporting CLI
 * Consolidates fragmented check/report scripts into a single diagnostic utility.
 *
 * Usage:
 *   node scripts/diagnostics.js --summary
 *   node scripts/diagnostics.js --sources
 *   node scripts/diagnostics.js --companies
 *   node scripts/diagnostics.js --recent
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Job = require("../models/job");

async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not configured.");
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

async function runDiagnostics() {
  const mode = process.argv[2] || "--summary";
  await connectDB();

  console.log("=== SkillBridge Database Diagnostics ===");

  if (mode === "--summary" || mode === "-s") {
    const total = await Job.countDocuments();
    const active = await Job.countDocuments({ isActive: true });
    const external = await Job.countDocuments({ isExternal: true });
    const fullDesc = await Job.countDocuments({ isFullDescription: true });

    console.log(`Total Jobs:         ${total}`);
    console.log(`Active Listings:    ${active}`);
    console.log(`External Aggregated:${external}`);
    console.log(`Full Structured JD: ${fullDesc} (${((fullDesc / total) * 100).toFixed(1)}%)`);

    const sources = await Job.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log("\nSources Breakdown:");
    sources.forEach(s => console.log(`  • ${s._id || "INTERNAL"}: ${s.count}`));

  } else if (mode === "--sources") {
    const sources = await Job.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);
    console.log("Source Breakdown (Total / Active):");
    sources.forEach(s => console.log(`  • ${s._id || "INTERNAL"}: ${s.count} total (${s.active} active)`));

  } else if (mode === "--companies") {
    const top = await Job.aggregate([
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    console.log("Top 20 Employers by Postings:");
    top.forEach((c, i) => console.log(`  ${i + 1}. ${c._id}: ${c.count} jobs`));

  } else if (mode === "--recent") {
    const recent = await Job.find({}, "title company createdAt source location")
      .sort({ createdAt: -1 })
      .limit(10);
    console.log("10 Most Recently Added Jobs:");
    recent.forEach((j, i) => console.log(`  ${i + 1}. [${j.company}] ${j.title} (${j.location}) - Source: ${j.source}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostics().catch(err => {
  console.error("Diagnostic Error:", err.message);
  process.exit(1);
});
