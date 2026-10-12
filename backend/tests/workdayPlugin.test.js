jest.mock('axios');
const axios = require('axios');
const WorkdayPlugin = require('../services/sde/plugins/WorkdayPlugin');

describe('WorkdayPlugin', () => {
  beforeEach(() => {
    axios.post.mockReset();
    axios.get.mockReset();
  });

  test('fetches every page with the CXS search body and stable identifiers', async () => {
    axios.get.mockResolvedValue({
      data: {
        jobPostingInfo: {
          title: 'Detailed role',
          jobDescription: '<p>Full description</p>',
          location: 'Bengaluru, India',
          timeType: 'Full-time'
        }
      }
    });
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      title: `Role ${index}`,
      externalPath: `/job/${index}`
    }));
    axios.post
      .mockResolvedValueOnce({ data: { total: 21, jobPostings: firstPage } })
      .mockResolvedValueOnce({
        data: {
          total: 0,
          jobPostings: [{ title: 'Role 20', externalPath: '/job/20' }]
        }
      });
    const plugin = new WorkdayPlugin();

    const jobs = await plugin.extractJobs({
      tenant: 'kyndryl',
      site: 'KyndrylProfessionalCareers',
      domain: 'kyndryl.wd5.myworkdayjobs.com'
    });

    expect(jobs).toHaveLength(21);
    expect(jobs[0].externalId).toBe('/job/0');
    expect(jobs[20].externalId).toBe('/job/20');
    expect(jobs[0].description).toBe('<p>Full description</p>');
    expect(jobs[0].title).toBe('Detailed role');
    expect(jobs[0].location).toBe('Bengaluru, India');
    expect(axios.get).toHaveBeenCalledTimes(21);
    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      'https://kyndryl.wd5.myworkdayjobs.com/wday/cxs/kyndryl/KyndrylProfessionalCareers/jobs',
      { appliedFacets: {}, limit: 20, offset: 0, searchText: '' },
      expect.any(Object)
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      { appliedFacets: {}, limit: 20, offset: 20, searchText: '' },
      expect.any(Object)
    );
  });

  test('fails incomplete pagination instead of returning a partial board', async () => {
    axios.post.mockResolvedValueOnce({ data: { total: 21, jobPostings: [] } });
    const plugin = new WorkdayPlugin();

    await expect(
      plugin.extractJobs({
        tenant: 'kyndryl',
        site: 'KyndrylProfessionalCareers',
        domain: 'kyndryl.wd5.myworkdayjobs.com'
      })
    ).rejects.toThrow('Incomplete Workday response at offset 0');
  });

  test('rejects non-Workday hosts before making a request', async () => {
    const plugin = new WorkdayPlugin();

    await expect(
      plugin.extractJobs({ tenant: 'example', domain: '127.0.0.1' })
    ).rejects.toThrow('Invalid Workday tenant, site, or domain');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('supports the stored tenant|site|domain identifier format', async () => {
    axios.post
      .mockResolvedValueOnce({ data: { total: 0, jobPostings: [] } })
      .mockResolvedValueOnce({ data: { total: 0, jobPostings: [] } });
    const plugin = new WorkdayPlugin();

    await expect(
      plugin.extractJobs(
        'kyndryl|KyndrylProfessionalCareers,KyndrylEarlyCareers|kyndryl.wd5.myworkdayjobs.com'
      )
    ).resolves.toEqual([]);
    expect(axios.post).toHaveBeenCalledWith(
      'https://kyndryl.wd5.myworkdayjobs.com/wday/cxs/kyndryl/KyndrylProfessionalCareers/jobs',
      expect.any(Object),
      expect.any(Object)
    );
    expect(axios.post).toHaveBeenCalledWith(
      'https://kyndryl.wd5.myworkdayjobs.com/wday/cxs/kyndryl/KyndrylEarlyCareers/jobs',
      expect.any(Object),
      expect.any(Object)
    );
    expect(axios.get).not.toHaveBeenCalled();
  });
});
