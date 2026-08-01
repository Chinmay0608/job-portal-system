const Company = require('../../models/Company');
const CompanyRegistryMetadata = require('../../models/CompanyRegistryMetadata');

class HealthMonitor {

  /**
   * Aggregates telemetry data from the Company and Metadata collections.
   * Useful for Admin Dashboards.
   */
  async getMetrics() {
    // 1. Status Distribution
    const statusCounts = await Company.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const metrics = {
      active: 0,
      dormant: 0,
      archived: 0,
      stale: 0,
      discovered: 0,
      verified: 0,
      platforms: {},
      averageCrawlTimeMs: 0
    };

    statusCounts.forEach(s => {
      if (s._id) metrics[s._id.toLowerCase()] = s.count;
    });

    // 2. Platform Distribution
    const platformCounts = await Company.aggregate([
      { $group: { _id: "$platformRef", count: { $sum: 1 } } }
    ]);
    platformCounts.forEach(p => {
      if (p._id) metrics.platforms[p._id] = p.count;
    });

    // 3. Average Crawl Time (across all companies that have been crawled)
    const crawlAverages = await CompanyRegistryMetadata.aggregate([
      { $match: { crawlDurationMs: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: "$crawlDurationMs" } } }
    ]);
    if (crawlAverages.length > 0) {
      metrics.averageCrawlTimeMs = Math.round(crawlAverages[0].avgDuration);
    }

    // 4. Success Rates (Heuristic based on stale vs active)
    const totalAttempted = metrics.active + metrics.stale + metrics.dormant;
    metrics.crawlerSuccessRate = totalAttempted > 0 
      ? Math.round((metrics.active / totalAttempted) * 100) + "%" 
      : "100%";

    return metrics;
  }
}

module.exports = new HealthMonitor();
