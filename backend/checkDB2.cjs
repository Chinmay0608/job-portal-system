require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const latestExt = await Job.findOne({ isExternal: true }).sort({ createdAt: -1 }).select('createdAt');
  const latestInt = await Job.findOne({ isExternal: { $ne: true } }).sort({ updatedAt: -1 }).select('updatedAt');
  
  console.log('Latest External Job createdAt:', latestExt?.createdAt);
  console.log('Latest Internal Job updatedAt:', latestInt?.updatedAt);
  
  process.exit(0);
});
