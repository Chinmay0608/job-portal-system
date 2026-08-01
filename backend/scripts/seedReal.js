const mongoose = require('mongoose');
const Company = require('../models/Company');
const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const discoveryQueue = new Queue('DiscoveryQueue', { connection: { host: '127.0.0.1', port: 6379 } });

const seedData = [
  { name: 'Stripe', website: 'https://stripe.com' },
  { name: 'Figma', website: 'https://figma.com' },
  { name: 'Vercel', website: 'https://vercel.com' },
  { name: 'Netflix', website: 'https://netflix.com' },
  { name: 'Reddit', website: 'https://reddit.com' }
];

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/job-portal-test');
  
  for (const comp of seedData) {
    const url = new URL(comp.website);
    const domain = url.hostname.replace('www.', '');
    
    let c = await Company.findOne({ normalizedDomain: domain });
    if (!c) {
      c = new Company({
        name: comp.name,
        website: comp.website,
        normalizedDomain: domain,
        verificationLevel: 'Seed Database'
      });
      await c.save();
    }
    
    await discoveryQueue.add('discover', {
      companyId: c._id,
      url: c.website
    });
    console.log(`Pushed ${c.name} to DiscoveryQueue`);
  }
  
  console.log('Seeding complete.');
  process.exit(0);
}

run().catch(console.error);
