const Company = require('../../models/Company');
const CompanyLifecycleEvent = require('../../models/CompanyLifecycleEvent');
const CompanyRegistryMetadata = require('../../models/CompanyRegistryMetadata');
const CrawlDeltaLog = require('../../models/CrawlDeltaLog');

class LifecycleManager {
  
  /**
   * Transitions a company to a new state, logging the event.
   * @param {string} companyId - ObjectId of the Company
   * @param {string} newState - 'VERIFIED', 'ACTIVE', 'STALE', 'DORMANT', 'ARCHIVED'
   * @param {string} reason - The reason for the transition
   */
  async transition(companyId, newState, reason) {
    const company = await Company.findById(companyId);
    if (!company) throw new Error(`Company not found: ${companyId}`);

    const previousState = company.status;
    
    // Skip if already in this state
    if (previousState === newState) return company;

    // 1. Update company status
    company.status = newState;
    
    // Apply default priorities based on state
    if (newState === 'DORMANT' || newState === 'ARCHIVED') {
      company.priority = 0;
    } else if (newState === 'STALE') {
      company.priority = 2; // slow down crawls
    } else if (newState === 'ACTIVE') {
      // Restore standard priority if returning from stale
      if (company.priority < 5) company.priority = 5;
    }

    await company.save();

    // 2. Persist transition history (Event Sourcing)
    await CompanyLifecycleEvent.create({
      companyId,
      previousState,
      newState,
      reason
    });

    console.log(`[LifecycleManager] Company ${companyId} transitioned ${previousState} -> ${newState} (${reason})`);
    return company;
  }

  /**
   * Helper called after a successful crawl that found jobs.
   */
  async recordSuccess(companyId, deltas, durationMs, freshness) {
    const meta = await this._getOrCreateMetadata(companyId);
    
    // Update telemetry
    meta.lastSuccessfulCrawl = new Date();
    meta.consecutiveEmptyCrawls = 0;
    
    const jobsFoundCount = deltas.newJobs + deltas.updatedJobs + deltas.unchangedJobs;

    // Moving averages
    meta.averageJobsFound = meta.averageJobsFound === 0 ? jobsFoundCount : Math.round((meta.averageJobsFound + jobsFoundCount) / 2);
    meta.crawlDurationMs = meta.crawlDurationMs === 0 ? durationMs : Math.round((meta.crawlDurationMs + durationMs) / 2);
    
    // Store deltas
    meta.latestCrawlDeltas = deltas;
    if (freshness) {
      meta.freshnessMetrics = freshness;
    }

    await meta.save();
    await this._logGlobalDeltas(deltas);

    // Transition state
    await this.transition(companyId, 'ACTIVE', `Successful crawl found ${jobsFoundCount} jobs`);
  }

  async _logGlobalDeltas(deltas) {
    const date = new Date().toISOString().split('T')[0];
    await CrawlDeltaLog.findOneAndUpdate(
      { date },
      {
        $inc: {
          newJobs: deltas.newJobs || 0,
          updatedJobs: deltas.updatedJobs || 0,
          expiredJobs: deltas.expiredJobs || 0,
          unchangedJobs: deltas.unchangedJobs || 0,
          failedJobs: deltas.failedJobs || 0
        }
      },
      { upsert: true }
    );
  }

  /**
   * Helper called after a failed crawl or a crawl finding 0 jobs.
   */
  async recordFailure(companyId, reason, failedJobs = 0) {
    const meta = await this._getOrCreateMetadata(companyId);
    
    meta.consecutiveEmptyCrawls += 1;
    meta.latestCrawlDeltas.failedJobs = failedJobs;
    await meta.save();

    if (failedJobs > 0) {
       await this._logGlobalDeltas({ failedJobs });
    }

    if (meta.consecutiveEmptyCrawls >= 4) {
      await this.transition(companyId, 'DORMANT', `4 consecutive failures. Last reason: ${reason}`);
    } else {
      await this.transition(companyId, 'STALE', `Crawl failure. Reason: ${reason}`);
    }
  }

  async _getOrCreateMetadata(companyId) {
    let meta = await CompanyRegistryMetadata.findOne({ companyId });
    if (!meta) {
      meta = new CompanyRegistryMetadata({ companyId });
      await meta.save();
    }
    return meta;
  }

  /**
   * Dynamically calculates Company Quality Score (0-100)
   */
  calculateQualityScore(company, meta) {
    let score = 50; // Base score
    
    if (company.verificationLevel === 'ATS Verified') score += 20;
    if (company.verificationLevel === 'Website Verified') score += 10;
    
    score -= (meta.consecutiveEmptyCrawls * 10);
    
    if (meta.averageJobsFound > 50) score += 10;
    if (meta.averageJobsFound > 100) score += 5;
    
    if (meta.freshnessMetrics && meta.freshnessMetrics.fresh24h > 0) score += 15;
    if (meta.freshnessMetrics && meta.freshnessMetrics.staleOver30d > 50) score -= 10;
    
    if (score < 0) return 0;
    if (score > 100) return 100;
    return score;
  }
}

module.exports = new LifecycleManager();
