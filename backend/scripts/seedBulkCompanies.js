const mongoose = require('mongoose');
const { resolve } = require('path');
const dotenv = require('dotenv');

// Load environment variables properly handling dotenvx if present
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const Company = require('../models/Company');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const companiesToSeed = [
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Salesforce', 'Oracle', 'IBM',
  'Cisco', 'NVIDIA', 'Intel', 'Qualcomm', 'Dell Technologies', 'VMware', 'SAP', 'ServiceNow', 'Uber', 'Airbnb',
  'LinkedIn', 'PayPal', 'JPMorgan Chase', 'Goldman Sachs', 'Morgan Stanley', 'Visa', 'Mastercard',
  'Walmart Global Tech', 'Target', 'Flipkart', 'Atlassian', 'Stripe', 'Block', 'Zoho', 'Freshworks',
  'Razorpay', 'PhonePe', 'CRED', 'Meesho', 'Swiggy', 'Zomato', 'Groww', 'Dream11', 'Deloitte',
  'Accenture', 'TCS', 'Infosys', 'Wipro', 'Cognizant'
];

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error("No MONGO_URI found in environment.");
    }
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    let inserted = 0;
    let skipped = 0;

    for (const name of companiesToSeed) {
      // Create normalized domain (e.g., google.com)
      const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

      const exists = await Company.findOne({ name });
      if (exists) {
        skipped++;
        continue;
      }

      await Company.create({
        name,
        website: `https://www.${domain}`,
        normalizedDomain: domain,
        platformRef: 'CUSTOM', // Explicitly marked custom so ATS crawler doesn't fail on them
        providerIdentifier: '',
        status: 'VERIFIED',
        verificationLevel: 'Seed Database'
      });
      console.log(`Inserted: ${name}`);
      inserted++;
    }

    console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding companies:', error);
    process.exit(1);
  }
}

seed();
