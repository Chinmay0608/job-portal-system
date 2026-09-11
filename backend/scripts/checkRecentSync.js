require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  await connectDB();
  const Job = require('../models/job');
  const Provider = require('../models/Provider');

  console.log('--- RECENT JOBS ---');
  const recent = await Job.find({}).sort({ createdAt: -1 }).limit(5).select('title company source createdAt updatedAt').lean();
  recent.forEach(j => {
    console.log(`Title: ${j.title} | Source: ${j.source} | Created: ${j.createdAt} | Updated: ${j.updatedAt}`);
  });

  console.log('\n--- PROVIDER SYNC STATUS ---');
  const providers = await Provider.find({}).lean();
  if (providers.length === 0) {
    console.log('No Provider records found in database.');
  } else {
    providers.forEach(p => {
      console.log(`Provider: ${p.name} | Status: ${p.lastStatus} | LastSync: ${p.lastSyncAt} | SyncedCount: ${p.lastSyncedCount} | Error: ${p.lastError}`);
    });
  }

  await mongoose.disconnect();
  process.exit(0);
})();
