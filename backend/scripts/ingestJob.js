#!/usr/bin/env node
/**
 * Generic Job Ingestion & Management CLI
 * Replaces one-off job posting scripts with a single extensible pipeline.
 *
 * Usage:
 *   node scripts/ingestJob.js --file path/to/jobs.json
 *   node scripts/ingestJob.js --json '[{"title":"SDE","company":"Google",...}]'
 *   node scripts/ingestJob.js --title "SWE Intern" --company "ABB India" --location "Bengaluru" --salary "₹80,000/mo" --batch "2027" --url "https://careers.abb.com"
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Job = require("../models/job");
const { resolveCompanyLogo, VERIFIED_ENTERPRISE_MAP } = require("../utils/companyLogoHelper");

function parseBatchToExperience(batch, defaultExp = "Not Specified") {
  if (!batch) return defaultExp;
  const str = String(batch);
  if (/2027|2028|fresher|intern/i.test(str)) return "Fresher";
  if (/2024|2025|2026/i.test(str)) return "0-2 Years";
  if (/2022|2023/i.test(str)) return "2-5 Years";
  return defaultExp;
}

function normalizeJobPayload(raw) {
  const company = (raw.company || "").trim();
  const title = (raw.title || "").trim();
  const role = (raw.role || title).trim();
  const location = (raw.location || "Remote, India").trim();
  const salary = (raw.salary || "Competitive").trim();
  const applyUrl = (raw.applyUrl || raw.url || "").trim();
  const batch = raw.batch || raw.batchEligibility || "";

  // Auto-resolve verified logo
  let companyLogo = raw.companyLogo || resolveCompanyLogo(company);

  // Extract experience required
  let experienceRequired = raw.experienceRequired;
  if (!experienceRequired || experienceRequired === "Not Specified") {
    experienceRequired = parseBatchToExperience(batch, "Fresher");
  }

  // Build description if already structured or wrap if plain text
  let description = raw.description || "";
  if (!description.includes("<h3>") && !description.includes("<p>")) {
    description = `<h3>Standard Job Title</h3>
<p>${title}</p>

<h3>Role Summary</h3>
<p>${raw.summary || description || `Exciting opportunity at ${company} for ${role}.`}</p>

<h3>Key Responsibilities</h3>
<p>${raw.responsibilities || "Refer to the employer career portal for detailed responsibilities."}</p>

<h3>Required Qualifications</h3>
<p>${raw.qualifications || `Graduating batch ${batch || "Freshers"} with relevant engineering/technical degree.`}</p>

<h3>Compensation and Benefits</h3>
<p>${salary}</p>

<h3>Work Arrangement and Location</h3>
<p>${location}</p>`;
  }

  const externalId = raw.externalId || `${company.replace(/[^a-z0-9]/gi, "").toUpperCase()}-${title.replace(/[^a-z0-9]/gi, "").toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const descriptionEnglish = raw.descriptionEnglish || description;
  const descriptionEnglishSourceHash = crypto.createHash("sha256").update("translation-v2:").update(description).digest("hex");

  return {
    title,
    role,
    company,
    location,
    salary,
    salaryMin: raw.salaryMin ?? null,
    salaryMax: raw.salaryMax ?? null,
    salaryCurrency: raw.salaryCurrency || "INR",
    applyUrl,
    isExternal: raw.isExternal ?? true,
    isActive: raw.isActive ?? true,
    companyLogo,
    description,
    descriptionEnglish,
    descriptionEnglishSourceHash,
    isFullDescription: true,
    skillsRequired: Array.isArray(raw.skillsRequired) ? raw.skillsRequired : (raw.skills ? raw.skills.split(",").map(s => s.trim()) : []),
    educationRequired: raw.educationRequired || (batch ? `Graduating Batch ${batch}` : "B.Tech / B.E / MCA / Equivalent"),
    experienceRequired,
    source: raw.source || "REFERRAL_INGESTION",
    externalId,
    employmentType: raw.employmentType || (/intern/i.test(title) ? "Internship (+PPO)" : "Full-Time"),
    isRemote: raw.isRemote ?? /remote/i.test(location),
    domain: raw.domain || "Software Engineering",
    seniorityLevel: raw.seniorityLevel || (/intern/i.test(title) ? "Intern / Fresher" : "Junior / Entry-Level"),
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [company, title, location, batch].filter(Boolean),
  };
}

async function ingestJobs(jobsList) {
  if (!Array.isArray(jobsList)) {
    jobsList = [jobsList];
  }

  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is missing.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const results = { created: 0, updated: 0, errors: [] };

  for (const raw of jobsList) {
    try {
      const job = normalizeJobPayload(raw);
      if (!job.title || !job.company) {
        console.warn("[IngestJob] Skipping item: missing title or company.");
        continue;
      }

      const existing = await Job.findOne({
        $or: [
          { externalId: job.externalId },
          { title: job.title, company: job.company },
        ],
      });

      if (existing) {
        // Preserve rich existing fields if not explicitly overridden
        if (!raw.description && existing.description && existing.description.length > job.description.length) {
          job.description = existing.description;
          job.descriptionEnglish = existing.description;
          job.descriptionEnglishSourceHash = crypto.createHash("sha256").update("translation-v2:").update(existing.description).digest("hex");
        }
        if (!raw.skillsRequired && !raw.skills && existing.skillsRequired?.length) {
          job.skillsRequired = existing.skillsRequired;
        }
        if (raw.salaryMin == null && existing.salaryMin != null) job.salaryMin = existing.salaryMin;
        if (raw.salaryMax == null && existing.salaryMax != null) job.salaryMax = existing.salaryMax;
        if (!raw.educationRequired && existing.educationRequired) job.educationRequired = existing.educationRequired;

        const updated = await Job.findByIdAndUpdate(existing._id, job, { returnDocument: "after" });
        console.log(`[UPDATED] ${job.company} - ${job.title} (ID: ${updated._id})`);
        console.log(`          Apply URL: ${updated.applyUrl}`);
        console.log(`          Logo: ${job.companyLogo || "None"} | Salary: ${job.salary}`);
        results.updated++;
      } else {
        const created = await Job.create(job);
        console.log(`[CREATED] ${job.company} - ${job.title} (ID: ${created._id})`);
        console.log(`          Apply URL: ${created.applyUrl}`);
        console.log(`          Logo: ${job.companyLogo || "None"} | Salary: ${job.salary}`);
        results.created++;
      }
    } catch (err) {
      console.error(`[IngestJob Error] Failed for ${raw.company || "unknown"}:`, err.message);
      results.errors.push({ item: raw, error: err.message });
    }
  }

  return results;
}

// CLI Argument Handling
async function runCLI() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log(`
Generic Job Ingestion CLI
Usage:
  node scripts/ingestJob.js --file <jobs.json>
  node scripts/ingestJob.js --json '<json string>'
  node scripts/ingestJob.js --title "<Title>" --company "<Company>" --location "<Location>" --salary "<Salary>" --batch "<Batch>" --url "<ApplyURL>"
    `);
    process.exit(0);
  }

  let jobsToIngest = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      const filePath = path.resolve(process.cwd(), args[i + 1]);
      const content = fs.readFileSync(filePath, "utf8");
      jobsToIngest = JSON.parse(content);
      break;
    }
    if (args[i] === "--json" && args[i + 1]) {
      jobsToIngest = JSON.parse(args[i + 1]);
      break;
    }
  }

  // Handle individual flags
  if (!jobsToIngest.length) {
    const getVal = (flag) => {
      const idx = args.indexOf(flag);
      return idx !== -1 && args[idx + 1] ? args[idx + 1] : "";
    };

    const title = getVal("--title");
    const company = getVal("--company");
    if (title && company) {
      jobsToIngest = [{
        title,
        company,
        role: getVal("--role") || title,
        location: getVal("--location") || "Remote, India",
        salary: getVal("--salary") || "Competitive",
        applyUrl: getVal("--url") || getVal("--applyUrl") || "",
        batch: getVal("--batch") || "",
        description: getVal("--desc") || getVal("--description") || "",
      }];
    }
  }

  if (!jobsToIngest.length) {
    console.error("No valid job input provided. Use --file, --json, or flag arguments.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    const stats = await ingestJobs(jobsToIngest);
    console.log("\n========================================");
    console.log(`Ingestion Complete: ${stats.created} Created, ${stats.updated} Updated, ${stats.errors.length} Errors.`);
    console.log("========================================");
    await mongoose.disconnect();
    process.exit(stats.errors.length ? 1 : 0);
  } catch (err) {
    console.error("Fatal error during ingestion:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = {
  ingestJobs,
  normalizeJobPayload,
};
