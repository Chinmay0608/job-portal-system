jest.mock('../services/sync.service', () => ({
  syncProvider: jest.fn().mockResolvedValue({ inserted: 1 }),
}));

const syncService = require('../services/sync.service');
const syncAdapter = require('../services/sde/SyncAdapter');
const Job = require('../models/job');

describe('SDE sync adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    syncService.syncProvider.mockResolvedValue({ inserted: 1 });
  });

  it('maps crawler jobs to the Job schema and derives only supported experience labels', async () => {
    await syncAdapter.processJobs('GREENHOUSE', [
      {
        title: 'Junior Software Engineer',
        companyName: 'Example',
        companyId: 'company-id',
        externalId: 'job-id',
        departments: ['Engineering'],
        description: 'Candidates should have 1-2 years of experience.',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    const normalized = provider.normalizeJob(rawJob);

    expect(normalized).toMatchObject({
      role: 'Engineering',
      company: 'Example',
      salary: 'Competitive',
      experienceRequired: '0-2 Years',
      isActive: true,
      companyId: 'company-id',
      source: 'SDE_GREENHOUSE',
      externalId: 'job-id',
    });
    expect(normalized.expiresAt).toBeInstanceOf(Date);
  });

  it('does not label jobs with no experience evidence as entry-level', async () => {
    await syncAdapter.processJobs('GREENHOUSE', [
      {
        title: 'Software Engineer',
        companyName: 'Example',
        externalId: 'job-id',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    expect(provider.normalizeJob(rawJob).experienceRequired).toBe('Not Specified');
  });

  it('prioritizes a 7+ years description over stale entry-level metadata', async () => {
    await syncAdapter.processJobs('WORKDAY', [
      {
        title: 'Application Support Engineer',
        companyName: 'Kyndryl',
        externalId: 'senior-support-job',
        experienceRequired: '0-2 Years',
        description: '<p>Required Technical and Professional Experience</p><ul><li>7+ years of experience in enterprise application support.</li></ul>',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    expect(provider.normalizeJob(rawJob).experienceRequired).toBe('5+ Years');
  });

  it('classifies experience ranges starting at five years as 5+ Years', async () => {
    await syncAdapter.processJobs('WORKDAY', [
      {
        title: 'Application Support Engineer',
        companyName: 'Kyndryl',
        externalId: 'senior-support-range-job',
        description: 'Minimum experience required is 7-10 years.',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    expect(provider.normalizeJob(rawJob).experienceRequired).toBe('5+ Years');
  });

  it('classifies an explicit 3+ years requirement as 2-5 Years', async () => {
    await syncAdapter.processJobs('WORKDAY', [
      {
        title: 'Software Engineer - Microsoft Power Platform Developer',
        companyName: 'Kyndryl',
        externalId: 'power-platform-developer-job',
        experienceRequired: '0-2 Years',
        description: 'Required Technical and Professional Expertise: At least 3+ years of hands-on development experience.',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    expect(provider.normalizeJob(rawJob).experienceRequired).toBe('2-5 Years');
  });

  it('uses the lower end of a wide year range instead of its plus-suffixed maximum', async () => {
    await syncAdapter.processJobs('GREENHOUSE', [
      {
        title: 'Software Engineer',
        companyName: 'Example',
        externalId: 'wide-experience-range-job',
        experienceRequired: '0-2 Years',
        description: 'Minimum requirements: 2-12+ years of industry software engineering experience.',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    expect(provider.normalizeJob(rawJob).experienceRequired).toBe('2-5 Years');
  });

  it('leaves alternative degree experience thresholds unspecified', async () => {
    await syncAdapter.processJobs('WORKDAY', [
      {
        title: 'Data Scientist',
        companyName: 'Example',
        externalId: 'alternative-degree-experience-job',
        description: 'Minimum Qualifications:\nPhD with 3+ years, MS with 6+ years, or BS with 8+ years of data science experience.',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    expect(provider.normalizeJob(rawJob).experienceRequired).toBe('Not Specified');
  });

  it('does not treat preferred experience as a required filter', async () => {
    await syncAdapter.processJobs('WORKDAY', [
      {
        title: 'Software Engineer',
        companyName: 'Example',
        externalId: 'preferred-experience-job',
        description: 'Preferred Qualifications:\n5+ years of experience with cloud services.',
      },
    ]);

    const provider = syncService.syncProvider.mock.calls[0][0];
    const [rawJob] = await provider.fetchJobs();
    expect(provider.normalizeJob(rawJob).experienceRequired).toBe('Not Specified');
  });

  it('surfaces sync failures so crawls do not expire listings on a failed write', async () => {
    syncService.syncProvider.mockResolvedValue({
      failed: 1,
      error: 'database write failed',
    });

    await expect(syncAdapter.processJobs('GREENHOUSE', [])).rejects.toThrow('Sync failed for GREENHOUSE: database write failed');
  });

  it('accepts unspecified experience in the job schema without assigning a false default', () => {
    const job = new Job({
      title: 'Software Engineer',
      role: 'Engineering',
      company: 'Example',
      location: 'Remote',
      salary: 'Competitive',
      description: 'Role details',
      isExternal: true,
    });

    expect(job.experienceRequired).toBe('Not Specified');
    expect(job.seniorityLevel).toBe('Not Specified');
    expect(job.validateSync()?.errors?.experienceRequired).toBeUndefined();
  });
});
