require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const intJobs = await Job.countDocuments({ isExternal: { $ne: true } });
  
  console.log('Total Internal Jobs:', intJobs);
  
  process.exit(0);
});
