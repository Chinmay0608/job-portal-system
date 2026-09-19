const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/db');
const MasterSkill = require('./models/MasterSkill');

async function run() {
  await connectDB();
  const skills = await MasterSkill.find({}).lean();
  console.log(skills.map(s => s.name).slice(0, 50));
  console.log("Total:", skills.length);
  process.exit(0);
}
run();
