const { Worker } = require('bullmq');
const PluginRegistry = require('../PluginRegistry');
const RawJobPayload = require('../../../models/RawJobPayload');
const HashOptimizer = require('../HashOptimizer');
const queueManager = require('../queues');
const LifecycleManager = require('../LifecycleManager');
const Job = require('../../../models/job');
const { classifyJob } = require('../../jobClassifierService');
const { performance } = require('perf_hooks');

class CrawlerWorker {
  constructor() {
    this.worker = null;
  }

  start(queueName = 'CrawlerQueue') {
    if (!queueManager.isOnline) {
      console.log('[SDE CrawlerWorker] Skipped startup because SDE Queues are offline.');
      return;
    }
    if (this.worker) return;

    this.worker = new Worker(queueName, async (job) => {
      console.log(`[SDE CrawlerWorker] Processing crawl job for company: ${job.data.companyId}`);
      const { providerName, identifier, companyId } = job.data;

      const plugin = PluginRegistry.getPlugin(providerName);
      if (!plugin) {
        throw new Error(`Plugin not found: ${providerName}`);
      }

      const t0 = performance.now();
      let rawJobs = [];
      let companyName = 'Unknown';
      try {
        const CompanyModel = require('../../../models/Company');
        const c = await CompanyModel.findById(companyId);
        if (c) companyName = c.name;
        
        // 1. Extract raw jobs using the provider plugin
        rawJobs = await plugin.extractJobs(identifier);
        rawJobs.forEach((rawJob) => {
          rawJob.companyName = companyName;
          rawJob.companyId = companyId;
        });
      } catch (err) {
        await LifecycleManager.recordFailure(job.data.companyId, `Extraction error: ${err.message}`);
        throw err;
      }
      
      const durationMs = performance.now() - t0;
      
      if (rawJobs.length === 0) {
        await LifecycleManager.recordFailure(job.data.companyId, '0 jobs returned from API');
        return { processed: 0, changed: 0 };
      }

      const deltas = { newJobs: 0, updatedJobs: 0, expiredJobs: 0, unchangedJobs: 0, failedJobs: 0 };
      const freshness = { fresh24h: 0, recent1to7d: 0, aging7to30d: 0, staleOver30d: 0 };
      
      const jobsToSync = [];
      const incomingExternalIds = new Set(rawJobs.map(j => j.externalId));
      const hasCompleteExternalIds = rawJobs.every((rawJob) => Boolean(rawJob.externalId));
      const now = new Date();

      for (const rawJob of rawJobs) {
        // Auto-classify domain if missing or "other"
        if (!rawJob.domain && (!rawJob.category || rawJob.category.toLowerCase() === 'other' || rawJob.category.toLowerCase() === 'uncategorized')) {
          try {
            const classification = classifyJob(rawJob);
            rawJob.domain = classification.domain;
            rawJob.category = classification.domain;
            if (classification.seniorityLevel !== 'Mid Level') {
              rawJob.seniorityLevel = classification.seniorityLevel;
            }
          } catch (err) {
            console.warn(`[CrawlerWorker] Domain classification failed for ${rawJob.title}:`, err.message);
          }
        }

        // 2. Hash optimization
        const hash = HashOptimizer.generateHash(rawJob);

        // Check if raw payload exists
        const existingRaw = await RawJobPayload.findOne({ 
          provider: providerName, 
          externalId: rawJob.externalId 
        });

        let jobDate = existingRaw ? existingRaw.fetchedAt : now;
        
        // Check for extraction date in the rawPayload if possible, else use fetchedAt
        if (rawJob.rawPayload && rawJob.rawPayload.updated_at) {
          jobDate = new Date(rawJob.rawPayload.updated_at);
        }

        const ageHours = (now - jobDate) / (1000 * 60 * 60);
        if (ageHours < 24) freshness.fresh24h++;
        else if (ageHours < 24 * 7) freshness.recent1to7d++;
        else if (ageHours < 24 * 30) freshness.aging7to30d++;
        else freshness.staleOver30d++;

        if (existingRaw) {
          if (!HashOptimizer.hasChanged(hash, existingRaw.hash)) {
            deltas.unchangedJobs++;
          } else {
            deltas.updatedJobs++;
          }
        } else {
          deltas.newJobs++;
        }

        // 3. Store raw payload
        const rawModel = existingRaw || new RawJobPayload({
          provider: providerName,
          externalId: rawJob.externalId,
          companyId: companyId
        });

        rawModel.companyId = companyId;
        rawModel.setPayload(rawJob.rawPayload);
        rawModel.hash = hash;
        rawModel.version = (rawModel.version || 0) + 1;
        rawModel.fetchedAt = now;
        rawModel.isActive = true;
        await rawModel.save();

        // Re-sync unchanged jobs too so live listings are refreshed and reactivated.
        jobsToSync.push(rawJob);
      }

      console.log(`[SDE CrawlerWorker] Extracted ${rawJobs.length} jobs. ${deltas.newJobs} new, ${deltas.updatedJobs} updated, ${deltas.unchangedJobs} unchanged.`);

      let syncMetrics;
      if (jobsToSync.length > 0) {
        const syncAdapter = require('../SyncAdapter');
        syncMetrics = await syncAdapter.processJobs(providerName, jobsToSync);
      }

      if (
        hasCompleteExternalIds &&
        syncMetrics &&
        syncMetrics.failed === 0 &&
        syncMetrics.invalid === 0 &&
        syncMetrics.inserted + syncMetrics.updated + syncMetrics.skipped > 0
      ) {
        const externalIds = Array.from(incomingExternalIds);
        const expiredDocs = await RawJobPayload.updateMany(
          {
            companyId,
            isActive: true,
            externalId: { $nin: externalIds },
          },
          { $set: { isActive: false } },
        );
        deltas.expiredJobs = expiredDocs.modifiedCount || 0;

        await Job.updateMany(
          {
            companyId,
            source: `SDE_${providerName}`,
            externalId: { $nin: externalIds },
            isActive: { $ne: false },
          },
          { $set: { isActive: false } },
        );
      } else {
        console.warn(`[SDE CrawlerWorker] Skipping stale-job expiry for ${companyId}: sync was incomplete or unsuccessful.`);
      }

      await LifecycleManager.recordSuccess(job.data.companyId, deltas, durationMs, freshness);

      return { processed: rawJobs.length, changed: deltas.newJobs + deltas.updatedJobs };
    }, { connection: queueManager.connection, stalledInterval: 300000, metrics: { maxDataPoints: 0 } });

    this.worker.on('failed', (job, err) => {
      console.error(`[SDE CrawlerWorker] Job ${job.id} failed:`, err.message);
    });

    console.log(`[SDE CrawlerWorker] Started on ${queueName}.`);
  }

  async stop() {
    if (!this.worker) return;
    await this.worker.close();
    this.worker = null;
  }
}

module.exports = new CrawlerWorker();
