const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Job = require("../models/job");

function classifyDomain(title = "", dept = "", desc = "") {
  const text = `${title} ${dept} ${desc}`.toLowerCase();
  if (/(data|analytics|machine learning|deep learning|bi engineer|data scientist|data analyst)/.test(text)) return "Data & Analytics";
  if (/(product manager|product designer|ux|ui|graphic design|creative director|design system|figma)/.test(text)) return "Product & Design";
  if (/(marketing|growth|seo|content|social media|brand|communications|pr manager|copywriter)/.test(text)) return "Marketing & Growth";
  if (/(sales|account executive|business development|bdr|sdr|account manager|partnerships|inside sales)/.test(text)) return "Sales & Business Dev";
  if (/(finance|accounting|accountant|payroll|tax|treasury|controller|billing|legal|counsel|compliance)/.test(text)) return "Finance & Accounting";
  if (/(recruiter|recruiting|talent|people ops|human resources|hr |culture|people partner|talent acquisition)/.test(text)) return "HR & Talent";
  if (/(customer support|customer success|client support|technical support|help desk|service|support engineer)/.test(text)) return "Customer Support";
  if (/(operations|supply chain|logistics|procurement|facilities|strategy & ops|chief of staff|warehouse|fleet)/.test(text)) return "Operations & Logistics";
  if (/(health|clinical|medical|nurse|patient|wellness|biotech|pharma|doctor|care)/.test(text)) return "Healthcare & General";
  return "Software & Tech";
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Classifying unclassified legacy jobs...");

  const unclassified = await Job.find({
    $or: [
      { "providerMetadata.domain": { $exists: false } },
      { "providerMetadata.domain": null },
      { "providerMetadata.domain": "" },
      { "providerMetadata.domain": "Unclassified" }
    ]
  });

  console.log(`Found ${unclassified.length} unclassified jobs to categorize.`);

  const ops = unclassified.map(j => {
    const domain = classifyDomain(j.title, j.role || (j.skillsRequired || []).join(" "), j.description);
    return {
      updateOne: {
        filter: { _id: j._id },
        update: {
          $set: {
            role: domain,
            "providerMetadata.domain": domain,
            keywords: Array.from(new Set([...(j.keywords || []), domain]))
          }
        }
      }
    };
  });

  if (ops.length > 0) {
    const res = await Job.bulkWrite(ops, { ordered: false });
    console.log(`Updated ${res.modifiedCount} jobs with domains.`);
  }

  const breakdown = await Job.aggregate([
    { $group: { _id: "$providerMetadata.domain", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log("\n--- UPDATED DOMAIN BREAKDOWN ---");
  breakdown.forEach(d => console.log(`  - ${d._id}: ${d.count} jobs`));
  console.log("--------------------------------\n");

  process.exit(0);
}

run().catch(console.error);
