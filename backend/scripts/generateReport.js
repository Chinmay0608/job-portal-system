const mongoose = require('mongoose');
const Company = require('../models/Company');
const RawJobPayload = require('../models/RawJobPayload');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/job-portal-test');

  const report = {};

  // Registry Size & Breakdown
  report.totalCompanies = await Company.countDocuments();
  report.failedValidation = await Company.countDocuments({ status: 'FAILED_VALIDATION' });
  report.verified = await Company.countDocuments({ status: 'VERIFIED' });
  report.active = await Company.countDocuments({ status: 'ACTIVE' });
  
  // Platform Distribution
  const platforms = await Company.aggregate([
    { $match: { status: { $ne: 'FAILED_VALIDATION' } } },
    { $group: { _id: "$platformRef", count: { $sum: 1 } } }
  ]);
  report.platforms = platforms;

  // Unknown Platforms
  report.unknownPlatforms = await Company.countDocuments({ platformRef: 'UNKNOWN' });

  // Jobs
  report.totalJobsImported = await RawJobPayload.countDocuments();
  
  const jobsByProvider = await RawJobPayload.aggregate([
    { $group: { _id: "$provider", count: { $sum: 1 } } }
  ]);
  report.jobsByProvider = jobsByProvider;

  // Top Hiring Companies (Aggregate by provider -> match to company is tricky here because companyId is string/ObjectId, let's group by companyId)
  const topHiring = await RawJobPayload.aggregate([
    { $group: { _id: "$companyId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  // Resolve Company Names for top hiring
  report.topHiring = [];
  for (const th of topHiring) {
    const comp = await Company.findById(th._id);
    if (comp) {
      report.topHiring.push({ name: comp.name, jobs: th.count });
    }
  }

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
