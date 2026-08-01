const SignatureVerifier = require('../services/sde/SignatureVerifier');
const LifecycleManager = require('../services/sde/LifecycleManager');
const Company = require('../models/Company');
const CompanyRegistryMetadata = require('../models/CompanyRegistryMetadata');
const CompanyLifecycleEvent = require('../models/CompanyLifecycleEvent');

// Mock mongoose models
jest.mock('../models/Company');
jest.mock('../models/CompanyRegistryMetadata');
jest.mock('../models/CompanyLifecycleEvent');
jest.mock('axios');
const axios = require('axios');

describe('SDE Phase B - Registry Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Signature Verifier', () => {
    it('detects Greenhouse via Hostname (Priority 1)', async () => {
      const res = await SignatureVerifier.verify('https://boards.greenhouse.io/stripe');
      expect(res.platform).toBe('GREENHOUSE');
      expect(res.confidence).toBe(100);
    });

    it('detects Lever via Hostname', async () => {
      const res = await SignatureVerifier.verify('https://jobs.lever.co/netflix');
      expect(res.platform).toBe('LEVER');
      expect(res.confidence).toBe(100);
    });

    it('handles malformed URLs safely', async () => {
      const res = await SignatureVerifier.verify('not-a-url');
      expect(res.platform).toBe('UNKNOWN');
      expect(res.confidence).toBe(0);
    });
  });

  describe('2. Lifecycle Manager (Dormancy & Reactivation)', () => {
    let mockCompany, mockMeta;

    beforeEach(() => {
      mockCompany = { _id: '123', status: 'ACTIVE', priority: 5, save: jest.fn() };
      mockMeta = { companyId: '123', consecutiveEmptyCrawls: 0, save: jest.fn() };
      
      Company.findById.mockResolvedValue(mockCompany);
      CompanyRegistryMetadata.findOne.mockResolvedValue(mockMeta);
      CompanyLifecycleEvent.create.mockResolvedValue(true);
    });

    it('transitions to STALE after 1 failure', async () => {
      await LifecycleManager.recordFailure('123', 'API Error');
      
      expect(mockMeta.consecutiveEmptyCrawls).toBe(1);
      expect(mockCompany.status).toBe('STALE');
      expect(mockCompany.priority).toBe(2);
      expect(mockCompany.save).toHaveBeenCalled();
    });

    it('transitions to DORMANT after 4 failures', async () => {
      mockMeta.consecutiveEmptyCrawls = 3; // 1 away from dormant
      await LifecycleManager.recordFailure('123', 'API Error');
      
      expect(mockMeta.consecutiveEmptyCrawls).toBe(4);
      expect(mockCompany.status).toBe('DORMANT');
      expect(mockCompany.priority).toBe(0);
    });

    it('reactivates from STALE/DORMANT if jobs found', async () => {
      mockCompany.status = 'DORMANT';
      mockCompany.priority = 0;
      mockMeta.consecutiveEmptyCrawls = 4;

      await LifecycleManager.recordSuccess('123', 50, 500);

      expect(mockMeta.consecutiveEmptyCrawls).toBe(0); // Reset
      expect(mockCompany.status).toBe('ACTIVE');
      expect(mockCompany.priority).toBe(5); // Restored standard priority
    });
  });
});
