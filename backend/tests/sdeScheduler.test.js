jest.mock('../models/Company', () => ({ find: jest.fn() }));
jest.mock('../models/CompanyRegistryMetadata', () => ({ findOne: jest.fn() }));
jest.mock('../services/sde/queues', () => ({
  isOnline: true,
  getQueue: jest.fn(),
}));
jest.mock('../services/sde/PluginRegistry', () => ({
  getAllPlugins: jest.fn(),
}));

const Company = require('../models/Company');
const CompanyRegistryMetadata = require('../models/CompanyRegistryMetadata');
const queueManager = require('../services/sde/queues');
const PluginRegistry = require('../services/sde/PluginRegistry');
const scheduler = require('../services/sde/scheduler');

describe('SDE priority scheduler', () => {
  let crawlerQueue;

  beforeEach(() => {
    jest.clearAllMocks();
    crawlerQueue = { add: jest.fn().mockResolvedValue(true) };
    PluginRegistry.getAllPlugins.mockReturnValue([{ name: 'GREENHOUSE' }, { name: 'LEVER' }]);
    Company.find.mockResolvedValue([
      {
        _id: 'company-id',
        name: 'Example',
        status: 'VERIFIED',
        platformRef: 'GREENHOUSE',
        providerIdentifier: 'example',
        priority: 9,
      },
    ]);
    CompanyRegistryMetadata.findOne.mockResolvedValue(null);
    queueManager.getQueue.mockReturnValue(crawlerQueue);
  });

  it('only schedules companies with supported ATS platforms and identifiers', async () => {
    await scheduler.sweep();

    expect(Company.find).toHaveBeenCalledWith({
      status: { $in: ['VERIFIED', 'ACTIVE', 'STALE', 'DORMANT'] },
      platformRef: { $in: ['GREENHOUSE', 'LEVER'] },
      providerIdentifier: { $nin: ['', null] },
    });
    expect(queueManager.getQueue).toHaveBeenCalledWith('crawler');
    expect(crawlerQueue.add).toHaveBeenCalledWith(
      'extractJobs',
      expect.objectContaining({
        companyId: 'company-id',
        providerName: 'GREENHOUSE',
        identifier: 'example',
      }),
      expect.objectContaining({ jobId: expect.stringMatching(/^crawl_company-id_/) }),
    );
  });
});
