const { getSyncStatus, triggerManualSync } = require("../../controllers/jobController");
const Provider = require("../../models/Provider");
const syncService = require("../../services/sync.service");
const config = require("../../config/jobAggregation");

jest.mock("../../models/Provider", () => ({
  find: jest.fn()
}));

jest.mock("../../services/sync.service", () => ({
  runAllSync: jest.fn().mockResolvedValue([])
}));

describe("Job Controller - Sync Endpoints", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getSyncStatus", () => {
    it("should return formatted sync status", async () => {
      Provider.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { name: "ADZUNA", isEnabled: true, lastStatus: "SUCCESS", lastSyncAt: "2023-01-01", totalJobsFetched: 100 }
        ])
      });

      config.useNewSyncEngine = true;
      config.isAggregationEnabled = true;
      config.syncDryRun = true;

      await getSyncStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        engine: "NEW",
        aggregationEnabled: true,
        dryRun: true,
        providers: [
          {
            name: "ADZUNA",
            enabled: true,
            status: "SUCCESS",
            lastSync: "2023-01-01",
            jobsFetched: 100
          }
        ]
      });
    });
  });

  describe("triggerManualSync", () => {
    it("should trigger sync and return 202 instantly", async () => {
      config.isAggregationEnabled = true;

      await triggerManualSync(req, res, next);

      expect(syncService.runAllSync).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it("should return 400 if aggregation is globally disabled", async () => {
      config.isAggregationEnabled = false;

      await triggerManualSync(req, res, next);

      expect(syncService.runAllSync).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
