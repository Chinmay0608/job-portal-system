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
   * Workday public CXS API: POST https://{domain}/wday/cxs/{tenant}/{site}/jobs
   * @param {string|object} identifier - Tenant string or tenant|site[,site]|domain string
   */
  async extractJobs(identifier) {
    const parts = typeof identifier === 'string' ? identifier.split('|') : [];
    const config =
      identifier !== null && typeof identifier === 'object'
        ? identifier
        : parts.length === 3
          ? { tenant: parts[0], site: parts[1], domain: parts[2] }
          : { tenant: identifier };
    const { tenant } = config;
    const configuredSites = config.site ?? `${tenant}_Careers`;
    const sites = Array.isArray(configuredSites)
      ? configuredSites
      : typeof configuredSites === 'string'
        ? configuredSites.split(',')
        : [];
    const domain = config.domain ?? `${tenant}.wd3.myworkdayjobs.com`;

    if (
      typeof tenant !== 'string' ||
      !/^[a-z0-9-]+$/i.test(tenant) ||
      !sites.length ||
      sites.some(
        (site) => typeof site !== 'string' || !/^[a-z0-9_-]+$/i.test(site)
      ) ||
      typeof domain !== 'string' ||
      !/^[a-z0-9.-]+\.myworkdayjobs\.com$/i.test(domain)
    ) {
      throw new Error('Invalid Workday tenant, site, or domain');
    }

    const pageSize = 20;
    const detailedJobs = [];
    for (const site of sites) {
      const baseUrl = `https://${domain}/wday/cxs/${tenant}/${site}`;
      const rawJobs = [];
      let total;

      for (
        let offset = 0;
        total === undefined || offset < total;
        offset += pageSize
      ) {
        const response = await axios.post(
          `${baseUrl}/jobs`,
          { appliedFacets: {}, limit: pageSize, offset, searchText: '' },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Accept-Language': 'en-US',
              'User-Agent': 'SkillBridgeBot/1.0 (+https://skillbridge.com/bot)'
            },
            timeout: 12000
          }
        );

        const page = response.data;
        if (
          !Number.isInteger(page?.total) ||
          page.total < 0 ||
          !Array.isArray(page.jobPostings) ||
          page.jobPostings.length > pageSize
        ) {
          throw new Error(`Invalid Workday response for ${tenant}/${site}`);
        }
        if (total === undefined) {
          if (page.total === 0 && page.jobPostings.length > 0) {
            throw new Error(`Invalid Workday job count for ${tenant}/${site}`);
          }
          total = page.total;
        } else if (page.total !== 0 && page.total !== total) {
          throw new Error(
            `Workday job count changed during extraction for ${tenant}/${site}`
          );
        }
        if (offset < total && page.jobPostings.length === 0) {
          throw new Error(
            `Incomplete Workday response at offset ${offset} for ${tenant}/${site}`
          );
        }

        rawJobs.push(...page.jobPostings);
      }

      for (let offset = 0; offset < rawJobs.length; offset += 5) {
        const batch = rawJobs.slice(offset, offset + 5);
        const details = await Promise.all(
          batch.map(async (job) => {
            if (!job.externalPath) {
              throw new Error(`Missing Workday job path for ${tenant}/${site}`);
            }
            const response = await axios.get(`${baseUrl}${job.externalPath}`, {
              headers: {
                Accept: 'application/json',
                'Accept-Language': 'en-US',
                'User-Agent':
                  'SkillBridgeBot/1.0 (+https://skillbridge.com/bot)'
              },
              timeout: 12000
            });
            const info = response.data?.jobPostingInfo;
            if (typeof info?.jobDescription !== 'string') {
              throw new Error(
                `Missing Workday job description for ${tenant}/${site}${job.externalPath}`
              );
            }
            return { ...job, jobPostingInfo: info };
          })
        );
        detailedJobs.push(...details.map((job) => ({ job, site })));
      }
    }

    const externalIds = new Set();
    return detailedJobs.map(({ job, site }) => {
      const externalId = job.externalPath;
      if (!externalId || externalIds.has(externalId)) {
        throw new Error(
          `Missing or duplicate Workday job identifier for ${tenant}/${site}`
        );
      }
      externalIds.add(externalId);

      return {
        externalId: String(externalId),
        title: job.jobPostingInfo.title || job.title || 'Untitled Position',
        description: job.jobPostingInfo.jobDescription,
        location:
          job.jobPostingInfo.location ||
          job.locationsText ||
          'Multiple Locations',
        employmentType:
          job.jobPostingInfo.timeType || job.timeType || 'Full-time',
        applyUrl: job.externalPath
          ? `https://${domain}/en-US/${site}${job.externalPath}`
          : `https://${domain}`,
        departments: job.subTitle ? [job.subTitle] : [],
        rawPayload: job
      };
    });
  }
}

module.exports = WorkdayPlugin;
