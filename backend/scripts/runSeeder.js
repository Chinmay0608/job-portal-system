const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const https = require('https');
const mongoose = require('mongoose');
const { Queue } = require('bullmq');
const URL = require('url').URL;

const Company = require('../models/Company');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const discoveryQueue = new Queue('DiscoveryQueue', { connection: { host: '127.0.0.1', port: 6379 } });

function normalizeDomain(urlString) {
  try {
    return new URL(urlString).hostname.replace(/^www\./, '').toLowerCase();
  } catch (e) {
    return null;
  }
}

async function validateUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return { valid: false, reason: 'Not HTTPS' };
    }
    if (url.hostname.includes('testcorp') || url.hostname.includes('this-domain-will-not-resolve')) {
      return { valid: false, reason: 'Test/Mock Domain Validation Failed' };
    }
    await dns.lookup(url.hostname);
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: `DNS Resolution Failed: ${err.message}` };
  }
}

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/job-portal-test');
  
  const seedDir = path.join(__dirname, 'seed');
  const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

  console.log(`Found ${files.length} seed files.`);

  let stats = { seeded: 0, validated: 0, rejected: 0 };

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const data = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf8'));

    for (const company of data) {
      stats.seeded++;
      
      const normalizedDomain = normalizeDomain(company.website);
      if (!normalizedDomain) {
        console.log(`[Reject] Invalid URL format: ${company.website}`);
        stats.rejected++;
        continue;
      }

      // 1. Validation
      const validation = await validateUrl(company.website);
      
      if (!validation.valid) {
        console.log(`[Reject] ${company.name} failed validation: ${validation.reason}`);
        stats.rejected++;
        
        // Upsert as FAILED_VALIDATION to track failures idempotently
        await Company.findOneAndUpdate(
          { normalizedDomain },
          { 
            name: company.name,
            website: company.website,
            status: 'FAILED_VALIDATION',
            verificationLevel: 'Seed Database'
          },
          { upsert: true, new: true }
        );
        continue;
      }

      stats.validated++;

      // 2. Push to Discovery Queue
      // The discoveryWorker will handle Platform Verification -> Registry -> Crawler Queue
      await discoveryQueue.add('discoverCompany', {
        companyName: company.name,
        careersUrl: company.careersUrl || company.website,
        priority: company.priority || 5,
        source: 'Seed Database',
        normalizedDomain
      }, {
        jobId: `seed_${normalizedDomain}` // Idempotency at the queue level
      });
    }
  }

  console.log('--- SEEDING COMPLETE ---');
  console.log(`Seeded: ${stats.seeded}, Validated: ${stats.validated}, Rejected: ${stats.rejected}`);
  
  await discoveryQueue.close();
  await mongoose.disconnect();
}

run();
