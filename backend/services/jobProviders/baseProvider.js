class BaseProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  /**
   * Optional authentication logic
   */
  async authenticate() {
    return true;
  }

  /**
   * Fetch jobs from the external API
   * @param {Date|null} lastSyncAt - For incremental sync
   * @returns {Promise<Array>} Array of raw job data
   */
  async fetchJobs(lastSyncAt) {
    throw new Error(`fetchJobs() not implemented for ${this.name}`);
  }

  /**
   * Normalize a raw job object into our internal Job Schema format
   * @param {Object} rawJob 
   * @returns {Object} Normalized Job
   */
  normalizeJob(rawJob) {
    throw new Error(`normalizeJob() not implemented for ${this.name}`);
  }

  /**
   * Validate normalized job payload before database insertion
   * @param {Object} normalizedJob 
   * @returns {Boolean}
   */
  validateJob(normalizedJob) {
    if (!normalizedJob.title || !normalizedJob.company || !normalizedJob.applyUrl || !normalizedJob.location) {
      return false;
    }
    try {
      const parsedUrl = new URL(normalizedJob.applyUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Get the timestamp of the last successful sync from the database
   */
  async getLastSyncTimestamp() {
    const Provider = require("../../models/Provider");
    const providerDoc = await Provider.findOne({ name: this.name.toUpperCase() });
    return providerDoc ? providerDoc.lastSyncAt : null;
  }

  /**
   * Define if this provider supports fetching jobs modified after a certain date
   */
  supportsIncrementalSync() {
    return false;
  }
}

module.exports = BaseProvider;
