const { Queue } = require('bullmq');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

class QueueManager {
  constructor() {
    this.connection = null;
    this.queues = {};
    this.isOnline = false;
  }

  async initialize() {
    try {
      // Setup ioredis with maxRetriesPerRequest: null as required by BullMQ
      this.connection = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, 
        retryStrategy(times) {
          if (times > 3) {
            console.warn('[SDE Queues] Redis connection failed after 3 retries. Disabling SDE.');
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        }
      });

      // Wait for 'ready' event or timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 3000);

        this.connection.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      this.isOnline = true;
      console.log('[SDE Queues] Redis connected successfully. SDE is ONLINE.');

      // Initialize the 5 required queues
      this.queues.discovery = new Queue('DiscoveryQueue', { connection: this.connection });
      this.queues.crawler = new Queue('CrawlerQueue', { connection: this.connection });
      this.queues.ai = new Queue('AIQueue', { connection: this.connection });
      this.queues.retry = new Queue('RetryQueue', { connection: this.connection });
      this.queues.dlq = new Queue('DeadLetterQueue', { connection: this.connection });

    } catch (err) {
      console.warn(`[SDE Queues] Failed to connect to Redis: ${err.message}. SDE gracefully disabled.`);
      this.isOnline = false;
      this.connection = null;
    }
  }

  getQueue(name) {
    if (!this.isOnline) return null;
    return this.queues[name];
  }
}

module.exports = new QueueManager();
