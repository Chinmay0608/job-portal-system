/**
 * cleanupFakeCompanies.js
 *
 * Removes all synthesized/fake company entries that have no real ATS presence.
 * Keeps:
 *   - Companies sourced from real job listings (verificationLevel: 'ATS Verified', priority: 6)
 *   - Curated marquee enterprises (priority: 9, DIRECT)
 *   - Any company already crawled (verificationLevel: 'ATS Verified' regardless of priority)
 * Deletes:
 *   - All 'Seed Database' companies with priority 5 (synthesized Phase C + old CUSTOM seeds)
 */

const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Company = require('../models/Company');

async function run() {
  await connectDB();

  // Count before
  const before = await Company.countDocuments();
  console.log(`Companies before cleanup: ${before}`);

  // Delete synthesized fake companies:
  // - verificationLevel: 'Seed Database'
  // - priority: 5 (all platforms: GREENHOUSE, LEVER, WORKDAY, ASHBY, SMARTRECRUITERS, DIRECT, CUSTOM)
  // These are all the Phase C generated + old seedBulkCompanies entries
  const result = await Company.deleteMany({
    verificationLevel: 'Seed Database',
    priority: 5
  });

  console.log(`Deleted ${result.deletedCount} fake/synthesized companies.`);

  // Count after
  const after = await Company.countDocuments();
  console.log(`Companies after cleanup: ${after}`);

  // Show what remains
  const remaining = await Company.aggregate([
    {
      $group: {
        _id: { vl: '$verificationLevel', p: '$priority', pl: '$platformRef' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  console.log('\nRemaining breakdown:');
  remaining.forEach(b => {
    console.log(`  [${b._id.vl}] priority=${b._id.p} platform=${b._id.pl} => ${b.count} companies`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
