// Mocking dependencies before requiring syncService
jest.mock("../../models/job", () => {
  return {
    bulkWrite: jest.fn().mockResolvedValue({
      upsertedCount: 1,
      modifiedCount: 0,
    }),
  };
});

jest.mock("../../models/Provider", () => {
  return {
    findOneAndUpdate: jest.fn().mockResolvedValue(true),
  };
});

const Job = require("../../models/job");
const syncService = require("../../services/sync.service");
const config = require("../../config/jobAggregation");

describe("Sync Service Engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process bulkOperations correctly when Dry Run is OFF", async () => {
    // Override dry run for this test
    config.syncDryRun = false;
    
    // Create a mock provider
    const mockProvider = {
      name: "MOCK_PROVIDER",
      authenticate: jest.fn().mockResolvedValue(true),
      getLastSyncTimestamp: jest.fn().mockResolvedValue(null),
      fetchJobs: jest.fn().mockResolvedValue([{ id: "1" }]),
      normalizeJob: jest.fn().mockReturnValue({
        title: "Test Job",
        company: "Test Co",
        location: "Remote",
        applyUrl: "http://test.com",
        source: "MOCK",
        externalId: "1",
        employmentType: "Full-time"
      }),
      validateJob: jest.fn().mockReturnValue(true),
    };

    const metrics = await syncService.syncProvider(mockProvider);
    
    expect(metrics.inserted).toBe(1);
    expect(Job.bulkWrite).toHaveBeenCalledTimes(1);
    
    // Verify the smart deduplication fallback logic within bulkWrite args
    const bulkArgs = Job.bulkWrite.mock.calls[0][0];
    expect(bulkArgs[0].updateOne.filter.externalId).toBe("1");
    expect(bulkArgs[0].updateOne.filter.source).toBe("MOCK");
  });

  it("should bypass bulkWrite when Dry Run is ON", async () => {
    // Override dry run for this test
    config.syncDryRun = true;
    
    const mockProvider = {
      name: "MOCK_PROVIDER",
      authenticate: jest.fn().mockResolvedValue(true),
      getLastSyncTimestamp: jest.fn().mockResolvedValue(null),
      fetchJobs: jest.fn().mockResolvedValue([{ id: "1" }]),
      normalizeJob: jest.fn().mockReturnValue({
        title: "Test Job",
        company: "Test Co",
        location: "Remote",
        applyUrl: "http://test.com",
        source: "MOCK",
        externalId: "1",
        employmentType: "Full-time"
      }),
      validateJob: jest.fn().mockReturnValue(true),
    };

    const metrics = await syncService.syncProvider(mockProvider);
    
    // Should simulate insertion
    expect(metrics.inserted).toBe(1);
    // But never actually call DB
    expect(Job.bulkWrite).not.toHaveBeenCalled();
  });
});
