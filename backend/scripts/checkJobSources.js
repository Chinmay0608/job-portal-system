require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  await connectDB();
  const Job = require('../models/job');

  // Check distinct sources
  const sources = await Job.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  console.log('Job sources:');
  sources.forEach(s => console.log(`  ${s._id || 'null/undefined'}: ${s.count}`));

  // Check isExternal
  const external = await Job.countDocuments({ isExternal: true });
  const internal = await Job.countDocuments({ isExternal: { $ne: true } });
  console.log(`\nExternal jobs: ${external}`);
  console.log(`Internal/manual jobs: ${internal}`);

  // Sample 3 jobs to see their structure
  const samples = await Job.find({}).limit(3).lean();
  console.log('\nSample jobs:');
  samples.forEach(j => console.log(` - ${j.title} @ ${j.company} | source=${j.source} | ext=${j.isExternal}`));

  await mongoose.disconnect();
  process.exit(0);
})();
