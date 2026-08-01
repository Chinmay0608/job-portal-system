const axios = require('axios');

class LeverPlugin {
  constructor() {
    this.name = 'LEVER';
    this.capabilities = {
      supportsPagination: false, // Lever typically returns all active jobs for a company ID
      supportsIncrementalSync: false,
      supportsSalary: false, // Rarely exposed cleanly in JSON
      supportsDepartments: true,
      supportsRemoteDetection: true,
      format: 'JSON'
    };
  }

  /**
   * Discovers and extracts raw jobs for a specific Lever account name.
   * Lever public API: https://api.lever.co/v0/postings/{accountName}?mode=json
   * @param {string} accountName - The company's Lever identifier
   */
  async extractJobs(accountName) {
    try {
      const url = `https://api.lever.co/v0/postings/${accountName}?mode=json`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'SkillBridgeBot/1.0 (+https://skillbridge.com/bot)'
        },
        timeout: 10000
      });

      const rawJobs = response.data || [];

      return rawJobs.map(job => ({
        externalId: job.id.toString(),
        title: job.text,
        description: job.descriptionPlain || job.description || '',
        location: job.categories?.location || 'Unknown',
        employmentType: job.categories?.commitment || 'Full-time',
        applyUrl: job.hostedUrl,
        departments: job.categories?.team ? [job.categories.team] : [],
        rawPayload: job
      }));
    } catch (error) {
      console.error(`[LeverPlugin] Failed to extract jobs for ${accountName}:`, error.message);
      return [];
    }
  }
}

module.exports = LeverPlugin;
