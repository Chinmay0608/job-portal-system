const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MasterSkillSchema = new mongoose.Schema({
  name: String,
  category: String,
});
const MasterSkill = mongoose.model('MasterSkill', MasterSkillSchema, 'masterskills');

async function getSkills() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const skills = await MasterSkill.find().select('name category -_id').lean();
    console.log(JSON.stringify(skills.slice(0, 50), null, 2));
    console.log(`Total skills found: ${skills.length}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

getSkills();
