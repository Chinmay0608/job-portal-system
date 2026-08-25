const { Worker } = require('bullmq');
const URL = require('url').URL;
const Company = require('../../../models/Company');
const CompanyRegistryMetadata = require('../../../models/CompanyRegistryMetadata');
const SignatureVerifier = require('../SignatureVerifier');
const LifecycleManager = require('../LifecycleManager');
const queueManager = require('../queues');

class DiscoveryWorker {
  constructor() {
    this.worker = null;
  }

  /**
   * Normalizes URLs to prevent duplicates like https://stripe.com vs http://stripe.com/
   */
  _normalizeUrl(urlString) {
    try {
      const url = new URL(urlString);
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch (e) {
      return urlString.toLowerCase();
    }
  }

  /**
   * Aggressively normalizes company names (e.g., "Stripe Inc." -> "stripe")
   */
  _normalizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  start() {
    if (!queueManager.isOnline) {
      console.log('[SDE DiscoveryWorker] Skipped startup because SDE Queues are offline.');
      return;
    }

    this.worker = new Worker('DiscoveryQueue', async (job) => {
      const { companyName, careersUrl, source = 'API' } = job.data;
      
      if (!companyName || !careersUrl) {
        console.warn(`[SDE DiscoveryWorker] Invalid job data in job ${job.id}: dropping.`);
        return { action: 'dropped', reason: 'Missing companyName or careersUrl' };
      }

      console.log(`[SDE DiscoveryWorker] Processing discovery for ${companyName} (${careersUrl})`);

      // 1. Normalization
      const normalizedHostname = this._normalizeUrl(careersUrl);
      const normalizedName = this._normalizeName(companyName);

      // 2. Platform Verification
      const signature = await SignatureVerifier.verify(careersUrl);

      // 3. Duplicate Detection (3-tier hierarchy)
      // Tier 1: Same ATS Token (Currently we only have ATS platform, if we extracted token we'd check here)
      // We'll rely on Hostname and Name for MVP since board token isn't natively exposed until extraction.
      
      // Tier 2: Same Hostname
      const existingByHost = await Company.findOne({ website: { $regex: normalizedHostname, $options: 'i' } });
      if (existingByHost) {
        console.log(`[SDE DiscoveryWorker] Duplicate detected via Hostname for ${companyName}. Dropping.`);
        return { action: 'dropped', reason: 'Duplicate Hostname' };
      }

      // Tier 3: Same Normalized Name
      // Since MongoDB doesn't store our aggressively normalized name natively without a specific field,
      // we do a regex search or exact match. We'll do an exact name check first.
      const existingByName = await Company.findOne({ name: { $regex: new RegExp(`^${companyName}$`, 'i') } });
      if (existingByName) {
        console.log(`[SDE DiscoveryWorker] Duplicate detected via Name for ${companyName}. Dropping.`);
        return { action: 'dropped', reason: 'Duplicate Name' };
      }

      // 4. Insertion
      // If signature is UNKNOWN or confidence < 80, we insert as DISCOVERED but it won't be crawled.
      // If signature >= 80, we insert and transition to VERIFIED.
      
      const newCompany = new Company({
        name: companyName,
        website: careersUrl, // Defaulting website to careers URL for MVP seed
        careerPage: careersUrl,
        platformRef: signature.platform,
        status: 'DISCOVERED',
        priority: signature.confidence >= 80 ? 5 : 2
      });

      await newCompany.save();

      // Create initial metadata
      const meta = new CompanyRegistryMetadata({
        companyId: newCompany._id,
        lastSuccessfulDiscovery: new Date(),
        lastPlatformDetection: new Date()
      });
      await meta.save();

      // Transition
      if (signature.confidence >= 80) {
        await LifecycleManager.transition(newCompany._id, 'VERIFIED', `Signature matched with ${signature.confidence}% confidence. Reason: ${signature.reason}`);
      }

      console.log(`[SDE DiscoveryWorker] Successfully registered ${companyName} (${signature.platform})`);
      return { action: 'registered', companyId: newCompany._id };

    }, { connection: queueManager.connection, stalledInterval: 300000, metrics: { maxDataPoints: 0 } });

    this.worker.on('failed', (job, err) => {
      console.error(`[SDE DiscoveryWorker] Job ${job.id} failed:`, err.message);
    });

    console.log('[SDE DiscoveryWorker] Started.');
  }
}

module.exports = new DiscoveryWorker();

