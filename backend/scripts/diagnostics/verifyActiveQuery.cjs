const mongoose = require('mongoose');
require('dotenv').config();

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

const query = {
  isActive: { $ne: false },
  $and: [
    {
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    },
    {
      $or: [
        { isExternal: true, createdAt: { $gte: thirtyDaysAgo } },
        { isExternal: true, updatedAt: { $gte: thirtyDaysAgo } },
        { isExternal: { $ne: true }, updatedAt: { $gte: ninetyDaysAgo } }
      ]
    }
  ]
};

async function testQuery() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const conn = await mongoose.connect(uri);
  const JobSchema = require('./models/job').schema;

  const testDb = conn.connection.useDb('test');
  const TestJob = testDb.model('Job', JobSchema);
  const countTest = await TestJob.countDocuments(query);
  console.log(`DB "test" matching active jobs: ${countTest}`);

  const portalDb = conn.connection.useDb('jobportal');
  const PortalJob = portalDb.model('Job', JobSchema);
  const countPortal = await PortalJob.countDocuments(query);
  console.log(`DB "jobportal" matching active jobs: ${countPortal}`);

  process.exit();
}

testQuery().catch(err => {
  console.error(err);
  process.exit(1);
});
