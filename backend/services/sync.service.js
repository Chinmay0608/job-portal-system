const providers = require("./jobProviders");
const Job = require("../models/job");
const Provider = require("../models/Provider");

class SyncService {
  /**
   * Run the sync engine for all registered and enabled providers
   * @returns {Promise<Array>} Array of metrics for each provider sync
   */
  async runAllSync() {
    const metrics = [];
    console.log(`[Sync Engine] Starting unified sync for ${providers.length} provider(s)...`);
    const startTime = Date.now();

    for (const provider of providers) {
      try {
        const providerMetrics = await this.syncProvider(provider);
        metrics.push(providerMetrics);
      } catch (error) {
        console.error(`[Sync Engine] Critical failure syncing provider ${provider.name}:`, error.message);
        metrics.push({
          provider: provider.name,
          failed: true,
          error: error.message,
        });
      }
    }

    const durationStr = ((Date.now() - startTime) / 1000).toFixed(2) + "s";
    console.log(`[Sync Engine] Unified sync complete. Duration: ${durationStr}`);
    return metrics;
  }

  /**
   * Sync a single provider
   */
  async syncProvider(provider) {
    const startTime = Date.now();
    let metrics = {
      provider: provider.name,
      fetched: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      invalid: 0,
      failed: 0,
      duration: "0s"
    };

    try {
      console.log(`[Sync Engine] Authenticating ${provider.name}...`);
      await provider.authenticate();

      // Get DB state
      const lastSyncAt = await provider.getLastSyncTimestamp();

      console.log(`[Sync Engine] Fetching jobs for ${provider.name}...`);
      const rawJobs = await provider.fetchJobs(lastSyncAt);
      metrics.fetched = rawJobs.length;

      if (rawJobs.length === 0) {
        metrics.duration = ((Date.now() - startTime) / 1000).toFixed(2) + "s";
        await this.updateProviderState(provider.name, "SUCCESS", null, 0);
        return metrics;
      }

      console.log(`[Sync Engine] Processing ${rawJobs.length} jobs from ${provider.name}...`);
      
      const bulkOperations = [];

      for (const rawJob of rawJobs) {
        try {
          const normalizedJob = provider.normalizeJob(rawJob);

          if (!provider.validateJob(normalizedJob)) {
            metrics.invalid++;
            continue;
          }

          // Deduplication strategy: Use externalId + source.
          // Fallback: title + company + location (if externalId is missing)
          let filter = {};
          if (normalizedJob.externalId) {
            filter = { source: normalizedJob.source, externalId: normalizedJob.externalId };
          } else {
            filter = {
              title: normalizedJob.title,
              company: normalizedJob.company,
              location: normalizedJob.location,
              isExternal: true
            };
          }

          bulkOperations.push({
            updateOne: {
              filter: filter,
              update: { $set: normalizedJob },
              upsert: true
            }
          });
        } catch (jobErr) {
          metrics.invalid++;
        }
      }

      if (bulkOperations.length > 0) {
        // Execute bulk write (unordered to prevent one failure failing the batch)
        const bulkResult = await Job.bulkWrite(bulkOperations, { ordered: false });
        metrics.inserted = bulkResult.upsertedCount || 0;
        metrics.updated = bulkResult.modifiedCount || 0;
        metrics.skipped = bulkOperations.length - (metrics.inserted + metrics.updated);
      }

      metrics.duration = ((Date.now() - startTime) / 1000).toFixed(2) + "s";
      
      console.log(`[Sync Engine] ${provider.name} Sync Complete:`, JSON.stringify(metrics));
      
      await this.updateProviderState(provider.name, "SUCCESS", null, metrics.inserted + metrics.updated);

      return metrics;
    } catch (error) {
      metrics.failed = 1;
      metrics.duration = ((Date.now() - startTime) / 1000).toFixed(2) + "s";
      console.error(`[Sync Engine] Provider ${provider.name} failed:`, error.message);
      await this.updateProviderState(provider.name, "FAILED", error.message, 0);
      return metrics;
    }
  }

  async updateProviderState(name, status, error, jobsCount) {
    try {
      await Provider.findOneAndUpdate(
        { name: name.toUpperCase() },
        {
          $set: {
            lastSyncAt: new Date(),
            lastStatus: status,
            lastError: error || "",
          },
          $inc: { totalJobsFetched: jobsCount }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error(`[Sync Engine] Failed to update state for provider ${name}:`, err.message);
    }
  }
}

module.exports = new SyncService();
