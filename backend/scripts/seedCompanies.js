require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const Company = require("../models/Company");

const CANDIDATES = [
  // --- Greenhouse ---
  { name: "Stripe", platformRef: "GREENHOUSE", providerIdentifier: "stripe", website: "https://stripe.com" },
  { name: "Anthropic", platformRef: "GREENHOUSE", providerIdentifier: "anthropic", website: "https://anthropic.com" },
  { name: "Notion", platformRef: "GREENHOUSE", providerIdentifier: "notion", website: "https://notion.so" },
  { name: "GitLab", platformRef: "GREENHOUSE", providerIdentifier: "gitlab", website: "https://gitlab.com" },
  { name: "Adyen", platformRef: "GREENHOUSE", providerIdentifier: "adyen", website: "https://adyen.com" },
  { name: "HelloFresh", platformRef: "GREENHOUSE", providerIdentifier: "hellofresh", website: "https://hellofresh.com" },
  { name: "N26", platformRef: "GREENHOUSE", providerIdentifier: "n26", website: "https://n26.com" },
  { name: "SumUp", platformRef: "GREENHOUSE", providerIdentifier: "sumup", website: "https://sumup.com" },
  // --- Lever ---
  { name: "Lever", platformRef: "LEVER", providerIdentifier: "lever", website: "https://lever.co" },
];

const validateGreenhouse = async (token) => {
  try {
    const res = await axios.get(`https://boards-api.greenhouse.io/v1/boards//jobs`, { timeout: 8000 });
    return Array.isArray(res.data?.jobs) && res.data.jobs.length > 0;
  } catch {
    return false;
  }
};

const validateLever = async (slug) => {
  try {
    const res = await axios.get(`https://api.lever.co/v0/postings/?mode=json`, { timeout: 8000 });
    return Array.isArray(res.data) && res.data.length > 0;
  } catch {
    return false;
  }
};

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("[Seed] Connected to MongoDB");

  let inserted = 0;
  let skippedInvalid = 0;
  let skippedExisting = 0;

  for (const candidate of CANDIDATES) {
    const exists = await Company.findOne({ name: candidate.name });
    if (exists) {
      console.log(`[Seed] Skipping  — already exists`);
      skippedExisting++;
      continue;
    }

    const isValid =
      candidate.platformRef === "GREENHOUSE"
        ? await validateGreenhouse(candidate.providerIdentifier)
        : await validateLever(candidate.providerIdentifier);

    if (!isValid) {
      console.warn(`[Seed] SKIPPED  — board token "" returned no jobs or failed. This company may have migrated ATS platforms since this script was written; remove or update this entry.`);
      skippedInvalid++;
      continue;
    }

    await Company.create({
      ...candidate,
      status: "VERIFIED",
      priority: 5,
      verificationLevel: "Seed Database",
    });
    console.log(`[Seed] Inserted  (validated live, )`);
    inserted++;
  }

  console.log(`\n[Seed] Done. Inserted: , skipped (invalid/stale token): , skipped (already existed): `);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("[Seed] Fatal error:", err);
  process.exit(1);
});
