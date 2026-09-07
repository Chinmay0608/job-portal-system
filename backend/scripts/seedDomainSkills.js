const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const MasterSkill = require("../models/MasterSkill");

async function seedDomainSkills() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not configured in backend/.env");
    }

    const dataPath = path.join(__dirname, "domainSkillsData.json");
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Skills dataset not found at: ${dataPath}`);
    }

    const domainSkillsData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB.");

    const initialCount = await MasterSkill.countDocuments();
    console.log(`Current MasterSkill count in database: ${initialCount}`);

    let totalInserted = 0;
    let totalUpdated = 0;

    for (const [domain, skills] of Object.entries(domainSkillsData)) {
      console.log(`\nProcessing Domain: [${domain}] (${skills.length} skills)...`);

      const bulkOps = skills.map((skillName) => {
        const cleanName = skillName.trim();
        const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          updateOne: {
            filter: { name: new RegExp(`^${escaped}$`, "i") },
            update: {
              $setOnInsert: { name: cleanName },
              $set: { category: domain },
            },
            upsert: true,
          },
        };
      });

      const batchSize = 250;
      let domainInserted = 0;
      let domainUpdated = 0;

      for (let i = 0; i < bulkOps.length; i += batchSize) {
        const chunk = bulkOps.slice(i, i + batchSize);
        const result = await MasterSkill.bulkWrite(chunk, { ordered: false });
        domainInserted += result.upsertedCount || 0;
        domainUpdated += result.modifiedCount || 0;
      }

      console.log(`  -> New Skills Inserted: ${domainInserted}`);
      console.log(`  -> Existing Skills Categorized: ${domainUpdated}`);

      totalInserted += domainInserted;
      totalUpdated += domainUpdated;
    }

    const finalCount = await MasterSkill.countDocuments();
    console.log("\n==================================================");
    console.log("DOMAIN SKILL SEEDING COMPLETE");
    console.log(`Total New Skills Added: ${totalInserted}`);
    console.log(`Total Skills Updated with Category: ${totalUpdated}`);
    console.log(`Grand Total MasterSkills in Database: ${finalCount}`);
    console.log("==================================================");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Error during skill seeding:", error);
    process.exit(1);
  }
}

seedDomainSkills();
