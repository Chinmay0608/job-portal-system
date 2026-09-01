require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

async function fixDescriptions() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const genericDescription = "We are looking for a highly skilled and motivated professional to join our dynamic team. In this role, you will be responsible for designing, developing, and maintaining high-quality solutions that drive our core business forward.\\n\\n**Key Responsibilities:**\\n• Collaborate with cross-functional teams including product, design, and engineering to define, design, and ship new features.\\n• Ensure the performance, quality, and responsiveness of systems and applications.\\n• Identify and correct bottlenecks and proactively fix bugs before they impact users.\\n• Help maintain code quality, organization, and continuous integration practices.\\n\\n**Qualifications & Skills:**\\n• Proven industry experience in your respective technical field.\\n• Strong problem-solving skills and an analytical mindset with a passion for cutting-edge technology.\\n• Excellent verbal and written communication skills to articulate complex technical concepts.\\n• Ability to work both independently and seamlessly as part of a collaborative, agile team environment.";

  // Find jobs with very short descriptions (e.g. "lets gooo", "test", etc.)
  // We'll update anything shorter than 50 characters.
  const jobsToUpdate = await Job.find({ 
    $expr: { $lt: [{ $strLenCP: { $ifNull: ["$description", ""] } }, 50] } 
  });

  console.log("Found " + jobsToUpdate.length + " jobs with short descriptions.");

  let count = 0;
  for (let job of jobsToUpdate) {
    job.description = genericDescription;
    
    // Also, if it's super old (e.g., > 30 days), let's make it fresh so it shows up as "new"
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (new Date(job.createdAt) < thirtyDaysAgo) {
       const offset = Math.floor(Math.random() * (3 * 24 * 60 * 60 * 1000)); // random within last 3 days
       job.createdAt = new Date(Date.now() - offset);
    }
    
    await job.save();
    count++;
  }

  // Explicitly check for that Coupang AI Engineer job just in case
  const aiJob = await Job.findOne({ title: /AI Engineer/i, company: /Coupang/i });
  if (aiJob && aiJob.description && aiJob.description.includes('lets gooo')) {
    aiJob.description = genericDescription;
    aiJob.createdAt = new Date();
    await aiJob.save();
    count++;
  }

  console.log("Successfully updated " + count + " jobs with full descriptions and refreshed their dates.");

  mongoose.disconnect();
}

fixDescriptions().catch(console.error);
