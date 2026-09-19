const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  const Job = require('./models/job');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeJobs = await Job.countDocuments({
    isActive: { $ne: false },
    createdAt: { $gte: thirtyDaysAgo }
  });

  console.log('Active jobs available for candidate feed:', activeJobs);
  process.exit();
}
test();
