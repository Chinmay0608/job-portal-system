const mongoose = require('mongoose');
const queueManager = require('../services/sde/queues');
const crawlerWorker = require('../services/sde/workers/crawlerWorker');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/job-portal-test');
  await queueManager.initialize();
  
  if (queueManager.isOnline) {
    console.log('Starting crawlerWorker manually...');
    crawlerWorker.start();
  }
}

run().catch(console.error);
