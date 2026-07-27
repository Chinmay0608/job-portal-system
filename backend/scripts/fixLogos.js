require("dotenv").config();
const connectDB = require("./config/db");
const Job = require("./models/job");

const runMigration = async () => {
  try {
    await connectDB();
    const jobs = await Job.find({ isExternal: true });

    let updatedCount = 0;
    for (const job of jobs) {
      let modified = false;

      // Fix companyLogo
      if (job.companyLogo && job.companyLogo.includes("remotive.com")) {
        job.companyLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`;
        modified = true;
      }

      // Fix tracking pixels in description
      if (
        job.description &&
        job.description.includes("remotive.com/job/track")
      ) {
        job.description = job.description.replace(
          /<img[^>]*src=["']https:\/\/remotive\.com\/job\/track[^>]*>/gi,
          "",
        );
        modified = true;
      }

      if (modified) {
        await job.save();
        updatedCount++;
      }
    }
    console.log(
      `Successfully fixed logos and tracking pixels for ${updatedCount} external jobs.`,
    );
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runMigration();
