require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const job = await Job.findOne({ title: "AI Engineer", company: /Coupang/i });
  console.log('Job found:', JSON.stringify(job, null, 2));
  process.exit(0);
});
