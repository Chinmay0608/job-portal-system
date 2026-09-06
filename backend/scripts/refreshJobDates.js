require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/job');

async function updateJobTimestamps() {
  const localUri = 'mongodb://127.0.0.1:27017/skillbridge';
  const atlasUri = process.env.MONGODB_URI;

  try {
    console.log('Attempting MongoDB connection to local instance:', localUri);
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
  } catch (err) {
    console.log('Local MongoDB failed, trying Atlas URI...');
    await mongoose.connect(atlasUri);
  }

  const jobs = await Job.find({}, { _id: 1 });
  console.log(`Found ${jobs.length} jobs to update...`);

  const now = new Date();
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    // Distribute creation dates evenly across the last 0-3 days
    const daysAgo = (i % 4); 
    const newDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - (i * 300000));
    
    await Job.updateOne(
      { _id: job._id },
      { $set: { createdAt: newDate, updatedAt: newDate } }
    );
  }

  console.log(`Successfully updated ${jobs.length} job timestamps to fresh recent dates (0-3 days ago).`);
  process.exit(0);
}

updateJobTimestamps().catch((err) => {
  console.error('Fatal error updating job dates:', err.message);
  process.exit(1);
});
