const axios = require('axios');

class WorkdayPlugin {
  constructor() {
    this.name = 'WORKDAY';
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
   * Discovers and extracts raw jobs for a specific Workday tenant.
   * Workday public CXS API: POST https://{tenant}.wd3.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs
   * @param {string|object} identifier - Company identifier object or tenant string (e.g. { tenant: 'salesforce', site: 'External' })
   */
  async extractJobs(identifier) {
    try {
      const tenant = typeof identifier === 'object' ? identifier.tenant : identifier;
      const site = (typeof identifier === 'object' && identifier.site) ? identifier.site : `${tenant}_Careers`;
      const domain = (typeof identifier === 'object' && identifier.domain) ? identifier.domain : `${tenant}.wd3.myworkdayjobs.com`;

      const url = `https://${domain}/wday/cxs/${tenant}/${site}/jobs`;

      const response = await axios.post(
        url,
        { limit: 50, offset: 0, searchText: '' },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SkillBridgeBot/1.0 (+https://skillbridge.com/bot)'
          },
          timeout: 12000
        }
      );

      const jobPostings = response.data?.jobPostings || [];

      return jobPostings.map((job, idx) => {
        const externalId = job.bulletFields?.[0] || job.externalPath || `wd-${idx}-${Date.now()}`;
        const applyUrl = job.externalPath ? `https://${domain}/en-US/${site}${job.externalPath}` : `https://${domain}`;

        return {
          externalId: String(externalId),
          title: job.title || 'Untitled Position',
          description: job.bulletFields ? job.bulletFields.join(' | ') : (job.title || ''),
          location: job.locationsText || 'Multiple Locations',
          employmentType: job.timeType || 'Full-time',
          applyUrl,
          departments: job.subTitle ? [job.subTitle] : [],
          rawPayload: job
        };
      });
    } catch (error) {
      console.error(`[WorkdayPlugin] Failed to extract jobs for ${JSON.stringify(identifier)}:`, error.message);
      return [];
    }
  }
}

module.exports = WorkdayPlugin;
