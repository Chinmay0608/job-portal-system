const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const Job = require('./models/job');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const freshExternal = await Job.countDocuments({ isExternal: true, createdAt: { $gte: thirtyDaysAgo } });
  const oldExternal = await Job.countDocuments({ isExternal: true, createdAt: { $lt: thirtyDaysAgo } });
  const internal = await Job.countDocuments({ isExternal: { $ne: true } });

  console.log({ freshExternal, oldExternal, internal });

  // Update old jobs so their createdAt/updatedAt are fresh and active!
  const now = new Date();
  
  // Randomize dates over the last 15 days so they look fresh and varied
  const allJobs = await Job.find({});
  console.log(`Refreshing ${allJobs.length} jobs to have fresh dates...`);

  for (let i = 0; i < allJobs.length; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 14); // 0 to 14 days ago
    const freshDate = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
    
    await Job.updateOne(
      { _id: allJobs[i]._id },
      { 
        $set: { 
          createdAt: freshDate,
          updatedAt: freshDate,
          isActive: true,
          expiresAt: null
        } 
      }
    );
  }

  console.log('All jobs successfully refreshed with fresh dates (0-14 days ago)!');
  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
