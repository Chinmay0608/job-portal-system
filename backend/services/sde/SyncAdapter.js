const syncService = require('../sync.service');

const getExplicitExperienceBuckets = (description) => {
  const text = String(description || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/<br\s*\/?>|<\/(?:p|li|h[1-6]|div|tr|section)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ');
  const patterns = [
    /\b(\d+)\s*(\+|(?:-|\u2013|to)\s*(\d+)\+?)\s*years?\b/gi,
    /\b(?:at least|minimum(?: of)?|more than|over)\s*(\d+)\s*years?\b/gi,
    /\bexperience(?: required)?\s*(?::|is|required is)\s*(\d+)\s*years?\b/gi,
    /(?<![-\d])\b(\d+)\s*\+\s*years?\b/gi,
    /\b(\d+)\s*years?\s+(?:(?:of|in)\s+)?(?:professional\s+)?experience\b/gi,
  ];
  const buckets = new Set();
  let preferredSection = false;

  for (const clause of text.split(/\n+|(?<=[.!?;])\s+/)) {
    if (/preferred|nice to have|bonus/i.test(clause)) preferredSection = true;
    else if (/\b(required|minimum qualifications|basic qualifications|what you(?:'|’)ll need)\b/i.test(clause)) preferredSection = false;
    if (preferredSection || !/experience/i.test(clause)) continue;

    for (const pattern of patterns) {
      for (const match of clause.matchAll(pattern)) {
        const minimum = Number(match[1] || match[2]);
        const maximum = Number(match[3]);
        buckets.add(minimum >= 5 ? '5+ Years' : minimum >= 3 || (minimum === 2 && maximum >= 3) ? '2-5 Years' : '0-2 Years');
      }
    }
  }

  return [...buckets];
};

const getExperienceRequired = (job) => {
  const explicitBuckets = getExplicitExperienceBuckets(job.description);
  if (explicitBuckets.length === 1) return explicitBuckets[0];
  if (explicitBuckets.length > 1) return 'Not Specified';

  const requirements = `${job.experienceRequired || ''} ${job.experienceLevel || ''}`.toLowerCase();
  const title = (job.title || '').toLowerCase();
  const level = `${job.experienceRequired || ''} ${job.experienceLevel || ''} ${job.seniorityLevel || ''}`.toLowerCase();

  const explicitMinimum = requirements.match(/\b(\d+)\s*\+\s*years?\b/);
  if (explicitMinimum && Number(explicitMinimum[1]) >= 5) return '5+ Years';
  if (explicitMinimum && Number(explicitMinimum[1]) >= 3) return '2-5 Years';
  if (/\b(5\+|more than 5|over 5|5 or more)\s*years?\b/.test(requirements)) {
    return '5+ Years';
  }
  const experienceRange = requirements.match(/\b(\d+)\s*(?:-|–|to)\s*(\d+)\s*years?\b/);
  if (experienceRange && Number(experienceRange[1]) >= 5) return '5+ Years';
  if (experienceRange && Number(experienceRange[1]) >= 3) return '2-5 Years';
  if (/\b2\s*(?:-|–|to)\s*5\s*years?\b/.test(requirements)) {
    return '2-5 Years';
  }
  if (/\b(?:0\s*(?:-|–|to)\s*[12]|1\s*(?:-|–|to)\s*2)\s*years?\b/.test(requirements)) {
    return '0-2 Years';
  }
  if (/\b(senior|lead|principal|staff)\b/.test(title) || /\b(senior level|staff\s*\/\s*principal)\b/.test(level)) return '5+ Years';
  if (/\b(mid[- ]level|intermediate)\b/.test(level)) return '2-5 Years';
  if (/\b(fresher|entry[- ]level|junior|intern(ship)?|graduate trainee)\b/.test(`${title} ${level}`)) return '0-2 Years';
  return 'Not Specified';
};

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
          role: rawJob.role || rawJob.departments?.join(', ') || rawJob.title,
          company: rawJob.companyName || 'Unknown Company', // passed from crawler
          location: rawJob.location || 'Unknown Location',
          salary: rawJob.salary || 'Competitive',
          description: rawJob.description || '',
          skillsRequired: rawJob.skillsRequired || [],
          educationRequired: rawJob.educationRequired || 'Not Specified',
          experienceRequired: getExperienceRequired(rawJob),
          seniorityLevel: rawJob.seniorityLevel || 'Not Specified',
          employmentType: rawJob.employmentType || 'Full-time',
          isExternal: true,
          isActive: true,
          companyId: rawJob.companyId,
          source: `SDE_${providerName}`,
          externalId: rawJob.externalId,
          applyUrl: rawJob.applyUrl || '',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
      },

      // Basic validation
      validateJob: (job) => {
        return !!job.title && !!job.externalId;
      },
    };

    // Inject into the existing sync engine
    console.log(`[SyncAdapter] Injecting ${extractedJobs.length} jobs into SyncEngine...`);
    const metrics = await syncService.syncProvider(mockProvider);
    console.log(`[SyncAdapter] SyncEngine finished:`, metrics);
    if (metrics.failed > 0) {
      throw new Error(`Sync failed for ${providerName}: ${metrics.error || 'provider sync failed'}`);
    }
    return metrics;
  }
}

const syncAdapter = new SyncAdapter();
syncAdapter.getExplicitExperienceBuckets = getExplicitExperienceBuckets;
module.exports = syncAdapter;
