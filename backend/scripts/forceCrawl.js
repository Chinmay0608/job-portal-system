const mongoose = require('mongoose');
const Company = require('../models/Company');
const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const crawlerQueue = new Queue('CrawlerQueue', { connection: { host: '127.0.0.1', port: 6379 } });

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/job-portal-test');
  
  const companies = await Company.find({ status: 'DISCOVERED' });
  
  for (const c of companies) {
    c.status = 'VERIFIED';
    c.platformRef = 'GREENHOUSE'; // Mocking platform since they use it
    await c.save();
    
    await crawlerQueue.add('extractJobs', {
      companyId: c._id,
      providerName: 'GREENHOUSE',
      identifier: c.name.toLowerCase()
    });
    console.log(`Pushed ${c.name} to CrawlerQueue`);
  }
  
  console.log('Forced crawl complete.');
  process.exit(0);
}

run().catch(console.error);
