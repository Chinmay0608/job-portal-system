const cron = require('node-cron');
const Company = require('../../models/Company');
const CompanyRegistryMetadata = require('../../models/CompanyRegistryMetadata');
const queueManager = require('./queues');
const crawlerWorker = require('./workers/crawlerWorker');
const crawlerWorker = require('./workers/crawlerWorker');

// Configurable Priority Table mapping Priority Weight to Hours between crawls
// In a real production system, this could be loaded from an Admin DB table or env vars.
const PRIORITY_SCHEDULE_CONFIG = {
  10: { frequencyHours: 1,  description: 'Hourly' },
  5:  { frequencyHours: 6,  description: 'Every 6 hours' },
  2:  { frequencyHours: 24, description: 'Daily' },
  0:  { frequencyHours: 720, description: 'Monthly (Dormant)' } // 30 days
};

class PriorityScheduler {
  
  constructor() {
    this.cronTask = null;
  }

  start() {
    if (!queueManager.isOnline) {
      console.log('[SDE PriorityScheduler] Skipped startup because SDE Queues are offline.');
      return;
    }

    // Run immediately on boot
    console.log('[SDE PriorityScheduler] Running initial priority sweep on boot...');
    this.sweep().catch(e => console.error(e));

    // The scheduler itself runs every 10 minutes to sweep for ANY due companies
    this.cronTask = cron.schedule('*/10 * * * *', async () => {
      console.log('[SDE PriorityScheduler] Running priority sweep...');
      try {
        await this.sweep();
      } catch (e) {
        console.error('[SDE PriorityScheduler] Sweep failed:', e.message);
      }
    });

    console.log('[SDE PriorityScheduler] Started. Sweeping every 10 minutes.');
  }

  /**
   * Queries the database for companies that are due for a crawl based on their priority tier.
   */
  async sweep() {
    // Only fetch companies that are VERIFIED, ACTIVE, STALE, or DORMANT
    const eligibleCompanies = await Company.find({
      status: { $in: ['VERIFIED', 'ACTIVE', 'STALE', 'DORMANT'] }
    });

    const now = new Date();
    let queuedCount = 0;

    for (const company of eligibleCompanies) {
      const priorityConfig = PRIORITY_SCHEDULE_CONFIG[company.priority];
      if (!priorityConfig) continue; // Safety fallback

      const meta = await CompanyRegistryMetadata.findOne({ companyId: company._id });
      
      // If it has never been crawled, it's immediately due.
      let isDue = false;
      if (!meta || !meta.lastSuccessfulCrawl) {
        isDue = true;
      } else {
        const hoursSinceLastCrawl = (now - meta.lastSuccessfulCrawl) / (1000 * 60 * 60);
        if (hoursSinceLastCrawl >= priorityConfig.frequencyHours) {
          isDue = true;
        }
      }

      if (isDue) {
        // Push to CrawlerQueue
        const crawlerQueue = queueManager.getQueue('crawler');
        if (crawlerQueue) {
          await crawlerQueue.add('extractJobs', {
            companyId: company._id,
            providerName: company.platformRef,
            identifier: company.providerIdentifier || company.name.toLowerCase().replace(/\s+/g, '')
          }, { 
            jobId: `crawl_${company._id}_${now.getTime()}` // Prevent duplicates in queue
          });
          queuedCount++;
        }
      }
    }

    console.log(`[SDE PriorityScheduler] Sweep complete. Queued ${queuedCount} companies for crawling.`);
  }
}

module.exports = new PriorityScheduler();


