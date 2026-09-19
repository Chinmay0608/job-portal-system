const mongoose = require('mongoose');
require('dotenv').config();

async function fixBothDBs() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const conn = await mongoose.connect(uri);
  const JobSchema = require('./models/job').schema;
  const now = new Date();

  // 1. Fix 'test' database
  const testDb = conn.connection.useDb('test');
  const TestJob = testDb.model('Job', JobSchema);
  const testTotal = await TestJob.countDocuments();
  const testUpdated = await TestJob.updateMany(
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
  console.log(`DB "test": ${testTotal} total jobs. Updated ${testUpdated.modifiedCount} jobs to active & fresh!`);

  // 2. Fix 'jobportal' database
  const portalDb = conn.connection.useDb('jobportal');
  const PortalJob = portalDb.model('Job', JobSchema);
  const portalTotal = await PortalJob.countDocuments();
  const portalUpdated = await PortalJob.updateMany(
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
  console.log(`DB "jobportal": ${portalTotal} total jobs. Updated ${portalUpdated.modifiedCount} jobs to active & fresh!`);

  process.exit();
}

fixBothDBs().catch(err => {
  console.error(err);
  process.exit(1);
});
