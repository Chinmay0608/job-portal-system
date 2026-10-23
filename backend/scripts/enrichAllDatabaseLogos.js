require("dotenv").config({ path: "D:/Projects/MERN Project/job-portal/backend/.env" });
const mongoose = require("mongoose");
const Job = require("../models/job");
const { resolveCompanyLogo } = require("../utils/companyLogoHelper");

async function enrichDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    // Distinct companies with empty or missing logo
    const companies = await Job.distinct("company", {
      $or: [
        { companyLogo: "" },
        { companyLogo: null },
        { companyLogo: { $exists: false } },
        { companyLogo: /ui-avatars\.com/ }
      ]
    });

    console.log(`Found ${companies.length} distinct companies needing logos.`);

    let updatedJobs = 0;
    let updatedCompanies = 0;

    for (const comp of companies) {
      if (!comp || typeof comp !== "string") continue;
      const logoUrl = resolveCompanyLogo(comp, "");
      if (logoUrl) {
        const res = await Job.updateMany(
          {
            company: comp,
            $or: [
              { companyLogo: "" },
              { companyLogo: null },
              { companyLogo: { $exists: false } },
              { companyLogo: /ui-avatars\.com/ }
            ]
          },
          { $set: { companyLogo: logoUrl } }
        );

        if (res.modifiedCount > 0) {
          updatedCompanies++;
          updatedJobs += res.modifiedCount;
          if (updatedCompanies <= 15 || updatedCompanies % 100 === 0) {
            console.log(`[${updatedCompanies}] Enriched "${comp}" -> ${logoUrl} (${res.modifiedCount} jobs)`);
          }
        }
      }
    }

    console.log(`\n=== DATABASE ENRICHMENT COMPLETE ===`);
    console.log(`Updated ${updatedJobs} job records across ${updatedCompanies} companies with official logos.`);
    process.exit(0);
  } catch (err) {
    console.error("Enrichment error:", err);
    process.exit(1);
  }
}

enrichDatabase();
