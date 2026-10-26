#!/usr/bin/env node
/**
 * Generic Company Logo Manager CLI
 * Consolidates all logo audit, enrichment, reset, and mapping tasks into one tool.
 *
 * Usage:
 *   node scripts/manageLogos.js --audit
 *   node scripts/manageLogos.js --enrich
 *   node scripts/manageLogos.js --reset
 *   node scripts/manageLogos.js --map "Company Name" "company.com"
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Job = require("../models/job");
const { resolveCompanyLogo, VERIFIED_ENTERPRISE_MAP } = require("../utils/companyLogoHelper");

const LOGO_HELPER_PATH = path.resolve(__dirname, "../utils/companyLogoHelper.js");

async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not configured.");
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

async function auditLogos() {
  await connectDB();
  const total = await Job.countDocuments();
  const withLogo = await Job.countDocuments({
    companyLogo: { $exists: true, $ne: null, $nin: ["", /ui-avatars\.com/] }
  });
  const withoutLogo = total - withLogo;
  const distinctCompanies = await Job.distinct("company");
  const missingCompanies = await Job.distinct("company", {
    $or: [{ companyLogo: "" }, { companyLogo: null }, { companyLogo: /ui-avatars\.com/ }]
  });

  console.log("=== Logo Coverage Audit ===");
  console.log(`Total Jobs:               ${total}`);
  console.log(`Jobs with Valid Logo:     ${withLogo} (${((withLogo / total) * 100).toFixed(1)}%)`);
  console.log(`Jobs missing Logo:        ${withoutLogo}`);
  console.log(`Total Companies:          ${distinctCompanies.length}`);
  console.log(`Companies missing Logo:   ${missingCompanies.length}`);
}

async function enrichLogos() {
  await connectDB();
  const missing = await Job.distinct("company", {
    $or: [{ companyLogo: "" }, { companyLogo: null }, { companyLogo: /ui-avatars\.com/ }]
  });

  console.log(`Found ${missing.length} distinct companies needing logos.`);
  let updatedCompanies = 0;
  let updatedJobs = 0;

  for (const company of missing) {
    if (!company) continue;
    const logoUrl = resolveCompanyLogo(company);
    if (logoUrl) {
      const res = await Job.updateMany(
        {
          company,
          $or: [{ companyLogo: "" }, { companyLogo: null }, { companyLogo: /ui-avatars\.com/ }]
        },
        { $set: { companyLogo: logoUrl } }
      );
      if (res.modifiedCount > 0) {
        updatedCompanies++;
        updatedJobs += res.modifiedCount;
        console.log(`[Enriched] ${company} -> ${logoUrl} (${res.modifiedCount} jobs)`);
      }
    }
  }

  console.log(`Enrichment Complete: ${updatedCompanies} companies updated across ${updatedJobs} jobs.`);
}

async function resetLogos() {
  await connectDB();
  console.log("Resetting invalid / broken logos...");
  const res = await Job.updateMany(
    { companyLogo: { $regex: /broken|invalid|undefined|null/i } },
    { $set: { companyLogo: "" } }
  );
  console.log(`Reset ${res.modifiedCount} jobs with broken logo URLs.`);
}

function mapCompanyDomain(company, domain) {
  if (!company || !domain) {
    console.error("Usage: node scripts/manageLogos.js --map <Company> <domain.com>");
    process.exit(1);
  }
  const cleanCompany = company.trim().toLowerCase();
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const logoUrl = `https://unavatar.io/${cleanDomain}`;

  let content = fs.readFileSync(LOGO_HELPER_PATH, "utf8");
  if (content.includes(`"${cleanCompany}":`)) {
    console.log(`Company "${cleanCompany}" is already mapped.`);
    return;
  }

  const newEntry = `  "${cleanCompany}": "${logoUrl}",\n`;
  content = content.replace(
    '  "swiggy": "https://unavatar.io/swiggy.com",\n',
    `  "swiggy": "https://unavatar.io/swiggy.com",\n${newEntry}`
  );
  fs.writeFileSync(LOGO_HELPER_PATH, content, "utf8");
  console.log(`Successfully mapped "${cleanCompany}" -> ${logoUrl}`);
}

async function run() {
  const args = process.argv.slice(2);
  const flag = args[0];

  try {
    if (flag === "--audit") {
      await auditLogos();
    } else if (flag === "--enrich") {
      await enrichLogos();
    } else if (flag === "--reset") {
      await resetLogos();
    } else if (flag === "--map") {
      mapCompanyDomain(args[1], args[2]);
      if (args.includes("--apply")) {
        await enrichLogos();
      }
    } else {
      console.log(`
Generic Logo Manager CLI
Usage:
  node scripts/manageLogos.js --audit         # Inspect logo coverage statistics
  node scripts/manageLogos.js --enrich        # Enrich all missing logos matching verified map
  node scripts/manageLogos.js --reset         # Reset invalid/corrupted logos
  node scripts/manageLogos.js --map "Name" "domain.com" [--apply] # Register new verified domain
      `);
    }
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Logo Manager Error:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { auditLogos, enrichLogos, resetLogos, mapCompanyDomain };
