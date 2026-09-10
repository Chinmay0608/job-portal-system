require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

(async () => {
  await connectDB();
  const Company = require('../models/Company');

  const breakdown = await Company.aggregate([
    {
      $group: {
        _id: {
          vl: '$verificationLevel',
          p: '$priority',
          pl: '$platformRef'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  console.log('Company breakdown:');
  breakdown.forEach(b => {
    console.log(`  [${b._id.vl}] priority=${b._id.p} platform=${b._id.pl} => ${b.count} companies`);
  });

  const total = await Company.countDocuments();
  console.log('Total:', total);

  await mongoose.disconnect();
  process.exit(0);
})();
