require('dotenv').config();
const mongoose = require('mongoose');
const MasterSkill = require('./models/MasterSkill');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const newSkills = ["Power BI", "Tableau"];
    let added = 0;
    
    for (const skill of newSkills) {
      const exists = await MasterSkill.findOne({ name: { $regex: new RegExp('^' + skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } });
      if (!exists) {
        await MasterSkill.create({ name: skill });
        added++;
        console.log(`Added: ${skill}`);
      } else {
        console.log(`Already exists: ${skill}`);
      }
    }
    console.log(`Finished. Added ${added} skills.`);
  } catch (error) {
    console.error("Error adding skills:", error);
  } finally {
    process.exit(0);
  }
});
