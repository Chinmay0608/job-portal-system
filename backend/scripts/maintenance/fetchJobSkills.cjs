const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');
const Job = require('./models/job');

async function run() {
  await connectDB();
  const jobs = await Job.find({ "skillsRequired.0": { $exists: true } }).lean();
  let allSkills = new Set();
  jobs.forEach(j => {
    (j.skillsRequired || []).forEach(s => allSkills.add(s));
    (j.skills || []).forEach(s => allSkills.add(s));
  });
  console.log(Array.from(allSkills).slice(0, 50));
  console.log("Total unique skills in jobs:", allSkills.size);
  process.exit(0);
}
run();
