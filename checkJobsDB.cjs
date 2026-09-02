const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function check() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal';
  console.log('Connecting to:', uri ? uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'none');
  await mongoose.connect(uri);
  const Job = require('./backend/models/job');
  
  const total = await Job.countDocuments();
  const active = await Job.countDocuments({ isActive: { $ne: false } });
  const external = await Job.countDocuments({ isExternal: true });
  const internal = await Job.countDocuments({ isExternal: { $ne: true } });
  
  console.log({ total, active, external, internal });
  
  const jobs = await Job.find({}).select('title company isExternal createdAt updatedAt isActive').lean();
  console.log(`Found ${jobs.length} total jobs in database:`);
  jobs.forEach(j => {
    console.log(`- [${j._id}] "${j.title}" at ${j.company} | External: ${j.isExternal} | Active: ${j.isActive} | Created: ${j.createdAt}`);
  });
  
  process.exit();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
