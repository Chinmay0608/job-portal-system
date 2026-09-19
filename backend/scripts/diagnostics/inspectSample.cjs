const mongoose = require('mongoose');
require('dotenv').config();

async function inspectSample() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const conn = await mongoose.connect(uri);
  const JobSchema = require('./models/job').schema;

  const testDb = conn.connection.useDb('test');
  const TestJob = testDb.model('Job', JobSchema);
  const testSample = await TestJob.find({}).limit(5).select('title company createdAt updatedAt isExternal isActive expiresAt').lean();
  console.log('Test DB Sample Jobs:', testSample);

  const portalDb = conn.connection.useDb('jobportal');
  const PortalJob = portalDb.model('Job', JobSchema);
  const portalSample = await PortalJob.find({}).limit(5).select('title company createdAt updatedAt isExternal isActive expiresAt').lean();
  console.log('JobPortal DB Sample Jobs:', portalSample);

  process.exit();
}

inspectSample().catch(err => {
  console.error(err);
  process.exit(1);
});
