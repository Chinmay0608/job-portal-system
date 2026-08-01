const axios = require('axios');

class GreenhousePlugin {
  constructor() {
    this.name = 'GREENHOUSE';
    this.capabilities = {
      supportsPagination: true,
      supportsIncrementalSync: false,
      supportsSalary: false, // Greenhouse public board API usually omits salary
      supportsDepartments: true,
      supportsRemoteDetection: true,
      format: 'JSON'
    };
  }

  /**
   * Discovers and extracts raw jobs for a specific Greenhouse board token.
   * Greenhouse boards API is public: https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs?content=true
   * @param {string} boardToken - The company's Greenhouse identifier
   */
  async extractJobs(boardToken) {
    try {
      // Greenhouse allows fetching all jobs at once for a board
      const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'SkillBridgeBot/1.0 (+https://skillbridge.com/bot)'
        },
        timeout: 10000
      });

      const rawJobs = response.data.jobs || [];

      return rawJobs.map(job => ({
        externalId: job.id.toString(),
        title: job.title,
        description: job.content || '', // Full HTML
        location: job.location ? job.location.name : 'Unknown',
        employmentType: 'Full-time', // Often not specified in basic response, inferred or parsed later
        applyUrl: job.absolute_url,
        departments: job.departments ? job.departments.map(d => d.name) : [],
        rawPayload: job
      }));
    } catch (error) {
      console.error(`[GreenhousePlugin] Failed to extract jobs for ${boardToken}:`, error.message);
      // Return empty array on failure, relying on retry mechanism upstream
      return [];
    }
  }
}

module.exports = GreenhousePlugin;
