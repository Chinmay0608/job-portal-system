/**
 * seed10kCompanies.js
 * 
 * Seeds curated companies and companies observed in real job listings.
 * 
 * Sources:
 * 1. Curated Fortune 500, Indian Tech Giants, Unicorns, and Top Global Tech Enterprises
 * 2. Company names observed in the Jobs collection
 * 
 * Guarantees:
 * - Unique, case-normalized company names (avoids index duplicate errors)
 * - Only assign domains for companies with a known real domain
 * - Safe idempotent upsert using MongoDB bulkWrite
 * - Do not mark unverified companies as ATS crawl targets
 */

const mongoose = require('mongoose');
const { resolve } = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Company = require('../models/Company');

// Curated Top Global & Indian Enterprises (Marquee leaders)
const MARQUEE_COMPANIES = [
  // India IT & Tech Giants
  { name: 'Tata Consultancy Services', domain: 'tcs.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Infosys', domain: 'infosys.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Wipro', domain: 'wipro.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'HCLTech', domain: 'hcltech.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Tech Mahindra', domain: 'techmahindra.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'L&T Technology Services', domain: 'ltts.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Persistent Systems', domain: 'persistent.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Mphasis', domain: 'mphasis.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Coforge', domain: 'coforge.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Birlasoft', domain: 'birlasoft.com', industry: 'Information Technology & Services', size: '5000-10000 employees' },
  { name: 'Tata Elxsi', domain: 'tataelxsi.com', industry: 'Software Development & SaaS', size: '5000-10000 employees' },
  { name: 'Happiest Minds', domain: 'happiestminds.com', industry: 'Information Technology & Services', size: '1001-5000 employees' },
  { name: 'Hexaware Technologies', domain: 'hexaware.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Sonata Software', domain: 'sonata-software.com', industry: 'Software Development & SaaS', size: '5000-10000 employees' },
  { name: 'Cyient', domain: 'cyient.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'KPIT Technologies', domain: 'kpit.com', industry: 'Software Development & SaaS', size: '5000-10000 employees' },
  { name: 'Zoho Corporation', domain: 'zoho.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Freshworks', domain: 'freshworks.com', industry: 'Software Development & SaaS', size: '5000-10000 employees' },
  { name: 'Postman', domain: 'postman.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'BrowserStack', domain: 'browserstack.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Chargebee', domain: 'chargebee.com', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'Hasura', domain: 'hasura.io', industry: 'Software Development & SaaS', size: '201-500 employees' },
  { name: 'Druva', domain: 'druva.com', industry: 'Cloud Infrastructure & DevOps', size: '1001-5000 employees' },
  { name: 'Icertis', domain: 'icertis.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'InMobi', domain: 'inmobi.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Glance', domain: 'glance.com', industry: 'Media & Interactive Entertainment', size: '1001-5000 employees' },
  { name: 'Razorpay', domain: 'razorpay.com', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'PhonePe', domain: 'phonepe.com', industry: 'Financial Technology & Banking', size: '5000-10000 employees' },
  { name: 'CRED', domain: 'cred.club', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'Pine Labs', domain: 'pinelabs.com', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'BharatPe', domain: 'bharatpe.com', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'Zerodha', domain: 'zerodha.com', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'Groww', domain: 'groww.in', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'Upstox', domain: 'upstox.com', industry: 'Financial Technology & Banking', size: '501-1000 employees' },
  { name: 'Flipkart', domain: 'flipkart.com', industry: 'E-Commerce & Digital Marketplaces', size: '10000+ employees' },
  { name: 'Meesho', domain: 'meesho.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Myntra', domain: 'myntra.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Nykaa', domain: 'nykaa.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Swiggy', domain: 'swiggy.com', industry: 'E-Commerce & Digital Marketplaces', size: '5000-10000 employees' },
  { name: 'Zomato', domain: 'zomato.com', industry: 'E-Commerce & Digital Marketplaces', size: '5000-10000 employees' },
  { name: 'Zepto', domain: 'zeptonow.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Blinkit', domain: 'blinkit.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'BigBasket', domain: 'bigbasket.com', industry: 'E-Commerce & Digital Marketplaces', size: '5000-10000 employees' },
  { name: 'Delhivery', domain: 'delhivery.com', industry: 'Supply Chain & Smart Logistics', size: '10000+ employees' },
  { name: 'Shadowfax', domain: 'shadowfax.in', industry: 'Supply Chain & Smart Logistics', size: '5000-10000 employees' },
  { name: 'Shiprocket', domain: 'shiprocket.in', industry: 'Supply Chain & Smart Logistics', size: '1001-5000 employees' },
  { name: 'Urban Company', domain: 'urbancompany.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Zetwerk', domain: 'zetwerk.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'OfBusiness', domain: 'ofbusiness.com', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'Moglix', domain: 'moglix.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Infra.Market', domain: 'infra.market', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Darwinbox', domain: 'darwinbox.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Keka HR', domain: 'keka.com', industry: 'Software Development & SaaS', size: '501-1000 employees' },
  { name: 'Leena AI', domain: 'leena.ai', industry: 'Artificial Intelligence & Machine Learning', size: '201-500 employees' },
  { name: 'Yellow.ai', domain: 'yellow.ai', industry: 'Artificial Intelligence & Machine Learning', size: '501-1000 employees' },
  { name: 'Gupshup', domain: 'gupshup.io', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'CleverTap', domain: 'clevertap.com', industry: 'Software Development & SaaS', size: '501-1000 employees' },
  { name: 'MoEngage', domain: 'moengage.com', industry: 'Software Development & SaaS', size: '501-1000 employees' },
  { name: 'Sprinklr', domain: 'sprinklr.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Dream11', domain: 'dream11.com', industry: 'Media & Interactive Entertainment', size: '1001-5000 employees' },
  { name: 'Mobile Premier League', domain: 'mpl.live', industry: 'Media & Interactive Entertainment', size: '501-1000 employees' },
  { name: 'Games24x7', domain: 'games24x7.com', industry: 'Media & Interactive Entertainment', size: '501-1000 employees' },
  { name: 'Nazara Technologies', domain: 'nazara.com', industry: 'Media & Interactive Entertainment', size: '501-1000 employees' },
  { name: 'Reliance Jio Platforms', domain: 'jio.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Airtel Digital', domain: 'airtel.in', industry: 'Information Technology & Services', size: '10000+ employees' },

  // Global Big Tech & Cloud Titans
  { name: 'Google', domain: 'google.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Microsoft', domain: 'microsoft.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Amazon Web Services', domain: 'aws.amazon.com', industry: 'Cloud Infrastructure & DevOps', size: '10000+ employees' },
  { name: 'Apple', domain: 'apple.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Meta', domain: 'meta.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'NVIDIA', domain: 'nvidia.com', industry: 'Artificial Intelligence & Machine Learning', size: '10000+ employees' },
  { name: 'Tesla', domain: 'tesla.com', industry: 'Aerospace & Robotics', size: '10000+ employees' },
  { name: 'Netflix', domain: 'netflix.com', industry: 'Media & Interactive Entertainment', size: '10000+ employees' },
  { name: 'Salesforce', domain: 'salesforce.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Adobe', domain: 'adobe.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Oracle', domain: 'oracle.com', industry: 'Cloud Infrastructure & DevOps', size: '10000+ employees' },
  { name: 'Cisco Systems', domain: 'cisco.com', industry: 'Cybersecurity & Network Defense', size: '10000+ employees' },
  { name: 'Intel Corporation', domain: 'intel.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'AMD', domain: 'amd.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Qualcomm', domain: 'qualcomm.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'Broadcom', domain: 'broadcom.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'IBM', domain: 'ibm.com', industry: 'Information Technology & Services', size: '10000+ employees' },
  { name: 'SAP', domain: 'sap.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'ServiceNow', domain: 'servicenow.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Workday', domain: 'workday.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Snowflake', domain: 'snowflake.com', industry: 'Cloud Infrastructure & DevOps', size: '5000-10000 employees' },
  { name: 'Databricks', domain: 'databricks.com', industry: 'Artificial Intelligence & Machine Learning', size: '5000-10000 employees' },
  { name: 'Palantir Technologies', domain: 'palantir.com', industry: 'Artificial Intelligence & Machine Learning', size: '1001-5000 employees' },
  { name: 'Cloudflare', domain: 'cloudflare.com', industry: 'Cybersecurity & Network Defense', size: '1001-5000 employees' },
  { name: 'Datadog', domain: 'datadoghq.com', industry: 'Cloud Infrastructure & DevOps', size: '5000-10000 employees' },
  { name: 'MongoDB', domain: 'mongodb.com', industry: 'Cloud Infrastructure & DevOps', size: '1001-5000 employees' },
  { name: 'Elastic', domain: 'elastic.co', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Confluent', domain: 'confluent.io', industry: 'Cloud Infrastructure & DevOps', size: '1001-5000 employees' },
  { name: 'CrowdStrike', domain: 'crowdstrike.com', industry: 'Cybersecurity & Network Defense', size: '5000-10000 employees' },
  { name: 'Palo Alto Networks', domain: 'paloaltonetworks.com', industry: 'Cybersecurity & Network Defense', size: '10000+ employees' },
  { name: 'Fortinet', domain: 'fortinet.com', industry: 'Cybersecurity & Network Defense', size: '10000+ employees' },
  { name: 'Zscaler', domain: 'zscaler.com', industry: 'Cybersecurity & Network Defense', size: '5000-10000 employees' },
  { name: 'SentinelOne', domain: 'sentinelone.com', industry: 'Cybersecurity & Network Defense', size: '1001-5000 employees' },
  { name: 'Okta', domain: 'okta.com', industry: 'Cybersecurity & Network Defense', size: '5000-10000 employees' },
  { name: 'Atlassian', domain: 'atlassian.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'GitLab', domain: 'gitlab.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'GitHub', domain: 'github.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Docker', domain: 'docker.com', industry: 'Cloud Infrastructure & DevOps', size: '501-1000 employees' },
  { name: 'HashiCorp', domain: 'hashicorp.com', industry: 'Cloud Infrastructure & DevOps', size: '1001-5000 employees' },
  { name: 'Twilio', domain: 'twilio.com', industry: 'Software Development & SaaS', size: '5000-10000 employees' },
  { name: 'Stripe', domain: 'stripe.com', industry: 'Financial Technology & Banking', size: '5000-10000 employees' },
  { name: 'Adyen', domain: 'adyen.com', industry: 'Financial Technology & Banking', size: '1001-5000 employees' },
  { name: 'Block', domain: 'block.xyz', industry: 'Financial Technology & Banking', size: '10000+ employees' },
  { name: 'PayPal', domain: 'paypal.com', industry: 'Financial Technology & Banking', size: '10000+ employees' },
  { name: 'Shopify', domain: 'shopify.com', industry: 'E-Commerce & Digital Marketplaces', size: '10000+ employees' },
  { name: 'Uber Technologies', domain: 'uber.com', industry: 'Software Development & SaaS', size: '10000+ employees' },
  { name: 'Airbnb', domain: 'airbnb.com', industry: 'Software Development & SaaS', size: '5000-10000 employees' },
  { name: 'DoorDash', domain: 'doordash.com', industry: 'E-Commerce & Digital Marketplaces', size: '10000+ employees' },
  { name: 'Instacart', domain: 'instacart.com', industry: 'E-Commerce & Digital Marketplaces', size: '1001-5000 employees' },
  { name: 'Pinterest', domain: 'pinterest.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Snap Inc.', domain: 'snap.com', industry: 'Software Development & SaaS', size: '5000-10000 employees' },
  { name: 'Spotify', domain: 'spotify.com', industry: 'Media & Interactive Entertainment', size: '5000-10000 employees' },
  { name: 'Reddit', domain: 'reddit.com', industry: 'Software Development & SaaS', size: '1001-5000 employees' },
  { name: 'Discord', domain: 'discord.com', industry: 'Media & Interactive Entertainment', size: '501-1000 employees' },
  { name: 'OpenAI', domain: 'openai.com', industry: 'Artificial Intelligence & Machine Learning', size: '1001-5000 employees' },
  { name: 'Anthropic', domain: 'anthropic.com', industry: 'Artificial Intelligence & Machine Learning', size: '201-500 employees' },
  { name: 'Cohere', domain: 'cohere.com', industry: 'Artificial Intelligence & Machine Learning', size: '201-500 employees' },
  { name: 'Hugging Face', domain: 'huggingface.co', industry: 'Artificial Intelligence & Machine Learning', size: '201-500 employees' },
  { name: 'Scale AI', domain: 'scale.com', industry: 'Artificial Intelligence & Machine Learning', size: '501-1000 employees' },
  { name: 'Midjourney', domain: 'midjourney.com', industry: 'Artificial Intelligence & Machine Learning', size: '11-50 employees' },
  { name: 'Stability AI', domain: 'stability.ai', industry: 'Artificial Intelligence & Machine Learning', size: '101-200 employees' },
  { name: 'Perplexity AI', domain: 'perplexity.ai', industry: 'Artificial Intelligence & Machine Learning', size: '51-200 employees' },
  { name: 'Mistral AI', domain: 'mistral.ai', industry: 'Artificial Intelligence & Machine Learning', size: '51-200 employees' }
];

/**
 * Main seeding execution
 */
async function run() {
  console.log('🚀 [Seed 10k Companies] Initializing...');
  await connectDB();

  // 1. Fetch existing companies from Company collection to avoid duplicates
  const existingDocs = await Company.find({}, { name: 1, normalizedDomain: 1 }).lean();
  const seenNames = new Set(existingDocs.map(c => c.name.toLowerCase().trim()));
  const seenDomains = new Set(existingDocs.map(c => (c.normalizedDomain || '').toLowerCase().trim()).filter(Boolean));

  console.log(`📊 Found ${existingDocs.length} existing companies in Company collection.`);

  // 2. Extract hiring companies from Jobs collection
  let jobCompanies = [];
  try {
    const Job = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({ company: String }, { strict: false }));
    jobCompanies = await Job.distinct('company');
    console.log(`🔍 Extracted ${jobCompanies.length} distinct hiring companies from Jobs collection.`);
  } catch (err) {
    console.warn('⚠️ Could not extract company names from Jobs collection:', err.message);
  }

  const companiesToInsert = [];

  // Helper to safely register a company without inventing crawl metadata.
  const registerCompany = (name, customDomain, industry, size) => {
    const cleanName = (name || '').trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 80) return;
    
    // Check name uniqueness (case-insensitive)
    const lowerName = cleanName.toLowerCase();
    if (seenNames.has(lowerName)) return;
    seenNames.add(lowerName);

    const domain = customDomain
      ?.replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
    const uniqueDomain = domain && !seenDomains.has(domain) ? domain : '';
    if (uniqueDomain) seenDomains.add(uniqueDomain);

    companiesToInsert.push({
      name: cleanName,
      website: uniqueDomain ? `https://${uniqueDomain}` : '',
      ...(uniqueDomain ? { normalizedDomain: uniqueDomain } : {}),
      careerPage: uniqueDomain ? `https://${uniqueDomain}/careers` : '',
      industry: industry || '',
      size: size || '',
      platformRef: 'UNKNOWN',
      providerIdentifier: '',
      status: 'DISCOVERED',
      priority: 2,
      verificationLevel: 'Seed Database'
    });
  };

  // Register curated companies without claiming their ATS is verified.
  for (const m of MARQUEE_COMPANIES) {
    registerCompany(m.name, m.domain, m.industry, m.size);
  }

  // Register companies observed in jobs without inventing websites or ATS tokens.
  for (const jobComp of jobCompanies) {
    if (!jobComp) continue;
    registerCompany(jobComp);
  }

  console.log(`📦 Registered ${companiesToInsert.length} curated/observed companies.`);

  console.log(`✨ Total curated/observed companies ready for insertion: ${companiesToInsert.length}`);

  // Insert in batches using bulkWrite.
  const BATCH_SIZE = 1000;
  let totalInserted = 0;

  for (let i = 0; i < companiesToInsert.length; i += BATCH_SIZE) {
    const batch = companiesToInsert.slice(i, i + BATCH_SIZE);
    const bulkOps = batch.map(doc => ({
      updateOne: {
        filter: { name: doc.name },
        update: { $setOnInsert: doc },
        upsert: true
      }
    }));

    const result = await Company.bulkWrite(bulkOps, { ordered: false });
    totalInserted += (result.upsertedCount || 0) + (result.insertedCount || 0);
    console.log(`💾 Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(companiesToInsert.length / BATCH_SIZE)} (Upserted: ${result.upsertedCount || 0})`);
  }

  const finalCount = await Company.countDocuments();
  console.log(`\n🎉 Company registry now has ${finalCount} records.`);
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error executing seed10kCompanies:', err);
  process.exit(1);
});
