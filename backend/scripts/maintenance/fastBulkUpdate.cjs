const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const Job = require('./models/job');
  
  console.log('Bulk updating all 994 jobs to be active and fresh...');
  const now = new Date();
  
  const result = await Job.updateMany(
    {},
    { 
      $set: { 
        createdAt: now,
        updatedAt: now,
        isActive: true,
        expiresAt: null
      } 
    }
  );

  console.log(`Successfully bulk refreshed ${result.modifiedCount} jobs with fresh dates!`);
  process.exit();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
