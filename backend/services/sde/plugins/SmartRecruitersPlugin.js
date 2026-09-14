const axios = require('axios');

class SmartRecruitersPlugin {
  constructor() {
    this.name = 'SMARTRECRUITERS';
    this.capabilities = {
      supportsPagination: true,
      supportsIncrementalSync: false,
      supportsSalary: false,
      supportsDepartments: true,
      supportsRemoteDetection: true,
      format: 'JSON'
    };
  }

  /**
   * Discovers and extracts raw jobs for a specific SmartRecruiters company ID.
   * SmartRecruiters public API: GET https://api.smartrecruiters.com/v1/companies/{companyId}/postings?limit=100
   * @param {string} companyId - The company's SmartRecruiters identifier
   */
  async extractJobs(companyId) {
    try {
      const url = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?limit=100`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'SkillBridgeBot/1.0 (+https://skillbridge.com/bot)'
        },
        timeout: 10000
      });

      const rawJobs = response.data?.content || [];

      return rawJobs.map((job) => {
        const locationStr = [
          job.location?.city,
          job.location?.region,
          job.location?.country
        ].filter(Boolean).join(', ') || 'Remote / Unspecified';

        const applyUrl = `https://jobs.smartrecruiters.com/${companyId}/${job.id}`;

        return {
          externalId: String(job.id),
          title: job.name || 'Untitled Position',
          description: job.jobAd?.sections?.jobDescription?.text || job.name || '',
          location: locationStr,
          employmentType: job.typeOfEmployment?.label || 'Full-time',
          applyUrl,
          departments: job.department?.label ? [job.department.label] : [],
          rawPayload: job
        };
      });
    } catch (error) {
      console.error(`[SmartRecruitersPlugin] Failed to extract jobs for ${companyId}:`, error.message);
      return [];
    }
  }
}

module.exports = SmartRecruitersPlugin;
