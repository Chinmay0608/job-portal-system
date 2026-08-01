const syncService = require('../sync.service');

class SyncAdapter {
  /**
   * Bridges SDE extracted jobs into the existing Sync Engine
   * without requiring any modifications to the legacy Sync Engine code.
   * 
   * @param {string} providerName - e.g., 'GREENHOUSE'
   * @param {Array} extractedJobs - The jobs from the crawler/AI pipeline
   */
  async processJobs(providerName, extractedJobs) {
    // Create an ephemeral mock provider that perfectly implements the 
    // BaseProvider interface expected by the Sync Engine.
    const mockProvider = {
      name: `SDE_${providerName}`,
      authenticate: async () => true, // No-op
      getLastSyncTimestamp: async () => null, // No-op, SDE handles its own scheduling
      
      // The Sync Engine will call fetchJobs() and receive the jobs we already extracted!
      fetchJobs: async () => {
        return extractedJobs;
      },

      // The pipeline has already normalized the jobs
      normalizeJob: (rawJob) => {
        return {
          title: rawJob.title,
          company: rawJob.companyName || 'Unknown Company', // passed from crawler
          location: rawJob.location || 'Unknown Location',
          salary: rawJob.salary || 0,
          description: rawJob.description || '',
          skillsRequired: rawJob.skillsRequired || [],
          employmentType: rawJob.employmentType || 'Full-time',
          experienceLevel: rawJob.experienceLevel || 'Entry Level',
          isExternal: true,
          source: `SDE_${providerName}`,
          externalId: rawJob.externalId,
          applyUrl: rawJob.applyUrl || ''
        };
      },

      // Basic validation
      validateJob: (job) => {
        return !!job.title && !!job.externalId;
      }
    };

    // Inject into the existing sync engine
    console.log(`[SyncAdapter] Injecting ${extractedJobs.length} jobs into SyncEngine...`);
    const metrics = await syncService.syncProvider(mockProvider);
    console.log(`[SyncAdapter] SyncEngine finished:`, metrics);
    return metrics;
  }
}

module.exports = new SyncAdapter();
