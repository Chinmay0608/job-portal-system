require("dotenv").config();
const connectDB = require("./config/db");
const Job = require("./models/job");

const extractExperience = (title) => {
  const t = title.toLowerCase();
  if (
    t.includes("senior") ||
    t.includes("lead") ||
    t.includes("director") ||
    t.includes("principal") ||
    t.includes("manager") ||
    t.includes("head")
  )
    return "5+ Years";
  if (
    t.includes("mid") ||
    t.includes("intermediate") ||
    t.includes("experienced")
  )
    return "2-5 Years";
  if (t.includes("junior") || t.includes("associate") || t.includes("entry"))
    return "0-2 Years";
  return "Fresher";
};

const runMigration = async () => {
  try {
    await connectDB();
    const jobs = await Job.find({ isExternal: true });

    let updatedCount = 0;
    for (const job of jobs) {
      const correctExp = extractExperience(job.title);
      if (job.experienceRequired !== correctExp) {
        job.experienceRequired = correctExp;
        await job.save();
        updatedCount++;
      }
    }
    console.log(
      `Successfully migrated ${updatedCount} external jobs to use correct experienceRequired.`,
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runMigration();
