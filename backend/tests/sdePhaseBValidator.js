const mongoose = require('mongoose');
const { performance } = require('perf_hooks');
const Company = require('../models/Company');
const CompanyRegistryMetadata = require('../models/CompanyRegistryMetadata');
const RawJobPayload = require('../models/RawJobPayload');
const PriorityScheduler = require('../services/sde/scheduler');

async function connectDB() {
  await mongoose.connect('mongodb://127.0.0.1:27017/job-portal-test');
}

async function validateRegistryScale() {
  console.log('\n--- 1. LARGE SCALE COMPANY REGISTRY ---');
  
  // Clear existing
  await Company.deleteMany({});
  await CompanyRegistryMetadata.deleteMany({});

  const sizes = [1000, 5000, 10000];
  
  for (const size of sizes) {
    console.log(`\nTesting ${size} Companies...`);
    
    const companies = [];
    for (let i = 0; i < size; i++) {
      companies.push({
        name: `Company ${i}`,
        website: `https://company${i}.com`,
        platformRef: i % 2 === 0 ? 'GREENHOUSE' : 'LEVER',
        status: 'ACTIVE',
        priority: 5
      });
    }

    const t0 = performance.now();
    await Company.insertMany(companies);
    const t1 = performance.now();
    console.log(`✓ Inserted ${size} companies in ${(t1-t0).toFixed(2)}ms`);

    // Measure scheduler sweep
    const t2 = performance.now();
    // Simulate sweep query
    const eligibleCompanies = await Company.find({
      status: { $in: ['VERIFIED', 'ACTIVE', 'STALE', 'DORMANT'] }
    }).lean();
    const t3 = performance.now();
    console.log(`✓ Registry lookup latency: ${(t3-t2).toFixed(2)}ms`);
    
    const memory = process.memoryUsage();
    console.log(`✓ Memory usage (Heap Used): ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    await Company.deleteMany({});
  }
}

async function validateDatabaseScale() {
  console.log('\n--- 2. DATABASE SCALE (RawJobPayload) ---');
  await RawJobPayload.deleteMany({});

  // 10,000 jobs simulation to estimate for 500,000
  const size = 10000;
  console.log(`Simulating insertion of ${size} jobs (Scale x50 for 500k projections)...`);
  
  const jobs = [];
  for (let i = 0; i < size; i++) {
    jobs.push({
      externalId: `job_${i}`,
      provider: 'GREENHOUSE',
      companyId: new mongoose.Types.ObjectId().toString(),
      payloadCompressed: Buffer.from('dummy_compressed_data'),
      hash: `hash_${i}`
    });
  }

  const t0 = performance.now();
  await RawJobPayload.insertMany(jobs, { ordered: false });
  const t1 = performance.now();
  
  console.log(`✓ BulkWrite Performance (${size} jobs): ${(t1-t0).toFixed(2)}ms`);
  console.log(`✓ Projected BulkWrite for 500k jobs: ${((t1-t0) * 50).toFixed(2)}ms`);

  const t2 = performance.now();
  await RawJobPayload.findOne({ hash: 'hash_9999' });
  const t3 = performance.now();
  console.log(`✓ Index Search Latency: ${(t3-t2).toFixed(2)}ms`);
  
  await RawJobPayload.deleteMany({});
}

async function run() {
  try {
    await connectDB();
    await validateRegistryScale();
    await validateDatabaseScale();
    console.log('\nValidation script complete.');
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.disconnect();
  }
}

run();
