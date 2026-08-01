const express = require('express');
const router = express.Router();
const HealthMonitor = require('../services/sde/HealthMonitor');
const CrawlDeltaLog = require('../models/CrawlDeltaLog');
const Company = require('../models/Company');
const RawJobPayload = require('../models/RawJobPayload');

router.get('/sde/health', async (req, res) => {
  try {
    const metrics = await HealthMonitor.getMetrics();
    
    // Get today's global deltas
    const date = new Date().toISOString().split('T')[0];
    const todayDeltas = await CrawlDeltaLog.findOne({ date }) || {
      newJobs: 0, updatedJobs: 0, expiredJobs: 0, unchangedJobs: 0, failedJobs: 0
    };

    // Get Top Hiring Companies directly
    const topHiringAgg = await RawJobPayload.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const topHiring = [];
    for (const agg of topHiringAgg) {
      const comp = await Company.findById(agg._id);
      if (comp) topHiring.push({ name: comp.name, count: agg.count });
    }

    // Get Failed Companies (Latest 5 FAILED_VALIDATION)
    const failedCompanies = await Company.find({ status: 'FAILED_VALIDATION' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name website');

    const result = {
      registrySize: (metrics.active || 0) + (metrics.stale || 0) + (metrics.dormant || 0) + (metrics.discovered || 0) + (metrics.verified || 0),
      platformDistribution: metrics.platforms,
      crawlerSuccess: metrics.crawlerSuccessRate,
      averageCrawlTime: metrics.averageCrawlTimeMs,
      todayDeltas,
      topHiring,
      failedCompanies
    };

    res.json(result);
  } catch (error) {
    console.error('[Admin API] Error fetching SDE health:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

module.exports = router;
