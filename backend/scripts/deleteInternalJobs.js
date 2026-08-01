const mongoose = require('mongoose');

async function run() {
  require('dotenv').config();
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillbridge');
  const db = mongoose.connection.db;
  
  const count = await db.collection('jobs').countDocuments({ isExternal: { $ne: true } });
  console.log('Internal Jobs found:', count);
  
  if (count > 0) {
    const result = await db.collection('jobs').deleteMany({ isExternal: { $ne: true } });
    console.log('Deleted internal jobs:', result.deletedCount);
  } else {
    console.log('No internal jobs to delete.');
  }
  
  process.exit(0);
}

run().catch(console.error);
