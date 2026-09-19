require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const total = await Job.countDocuments();
  const active = await Job.countDocuments({ isActive: { $ne: false } });
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  const ext30 = await Job.countDocuments({ isExternal: true, createdAt: { $gte: thirtyDaysAgo } });
  const int90 = await Job.countDocuments({ isExternal: { $ne: true }, updatedAt: { $gte: ninetyDaysAgo } });
  
  const manualQueryActive = await Job.countDocuments({
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
          { isExternal: { $ne: true }, updatedAt: { $gte: ninetyDaysAgo } }
        ]
      }
    ]
  });
  
  console.log('Total jobs:', total);
  console.log('Active (isActive != false) jobs:', active);
  console.log('External < 30 days:', ext30);
  console.log('Internal < 90 days:', int90);
  console.log('Total returned by getBaseActiveJobQuery():', manualQueryActive);
  
  process.exit(0);
});
