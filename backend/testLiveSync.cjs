const mongoose = require('mongoose');
require('dotenv').config();
const syncService = require('./services/sync.service');

async function testAdzunaSync() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to Mongo...');
  await mongoose.connect(uri);

  console.log('Running live sync from job providers...');
  const metrics = await syncService.runAllSync();
  console.log('Sync Metrics:', JSON.stringify(metrics, null, 2));

  process.exit();
}

testAdzunaSync().catch(err => {
  console.error('Adzuna Sync Error:', err);
  process.exit(1);
});
