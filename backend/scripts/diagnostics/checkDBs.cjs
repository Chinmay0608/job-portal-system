const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllDBs() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  console.log('Connecting to:', uri);
  const conn = await mongoose.connect(uri);
  
  const admin = conn.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Databases on Cluster:', dbs.databases);

  // Check jobs count in current db
  const Job = require('./models/job');
  const currentDbName = conn.connection.db.databaseName;
  const countCurrent = await Job.countDocuments();
  console.log(`Current DB (${currentDbName}) jobs count:`, countCurrent);

  // Check each database for jobs collection
  for (let dbInfo of dbs.databases) {
    if (['admin', 'local'].includes(dbInfo.name)) continue;
    const db = conn.connection.useDb(dbInfo.name);
    const JobModel = db.model('Job', Job.schema);
    const count = await JobModel.countDocuments();
    console.log(`DB "${dbInfo.name}" jobs count:`, count);
  }

  process.exit();
}

checkAllDBs().catch(err => {
  console.error(err);
  process.exit(1);
});
