require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const jobs = await Job.find({}).limit(5).select('title company createdAt updatedAt isExternal expiresAt');
  console.log(jobs);
  process.exit(0);
});
