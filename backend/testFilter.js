require('dotenv').config();
const connectDB = require('./config/db');
const Job = require('./models/job');
const User = require('./models/user');

const run = async () => {
  await connectDB();
  const query = { isActive: { $ne: false }, isExternal: true };
  query.$or = [
    { location: { $regex: /india|worldwide|anywhere|global/i } },
    { location: { $regex: /remote/i } },
    { description: { $regex: /visa|sponsorship|sponsor|relocation/i } }
  ];
  const jobs = await Job.find(query);
  console.log('Matching jobs count:', jobs.length);
  process.exit(0);
};
run();
