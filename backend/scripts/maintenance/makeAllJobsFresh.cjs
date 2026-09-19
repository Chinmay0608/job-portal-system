const mongoose = require('mongoose');
require('dotenv').config();

async function makeAllJobsFresh() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const conn = await mongoose.connect(uri);
  const JobSchema = require('./models/job').schema;
  const now = new Date();

  console.log('Setting createdAt and updatedAt to NOW (Sep 2, 2026) for all jobs in both databases...');

  // 1. Update 'test' DB
  const testDb = conn.connection.useDb('test');
  const TestJob = testDb.model('Job', JobSchema);
  const testResult = await TestJob.updateMany(
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
  console.log(`Updated ${testResult.modifiedCount} jobs in DB "test".`);

  // 2. Update 'jobportal' DB
  const portalDb = conn.connection.useDb('jobportal');
  const PortalJob = portalDb.model('Job', JobSchema);
  const portalResult = await PortalJob.updateMany(
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
  console.log(`Updated ${portalResult.modifiedCount} jobs in DB "jobportal".`);

  process.exit();
}

makeAllJobsFresh().catch(err => {
  console.error(err);
  process.exit(1);
});
