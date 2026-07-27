const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const Job = require("./models/job");
const MasterSkill = require("./models/MasterSkill");

const seedSkills = async () => {
  await connectDB();

  // Basic tech stack that should always be present
  const baseSkills = [
    "Java",
    "Python",
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "C++",
    "C#",
    "AWS",
    "Docker",
    "Kubernetes",
    "SQL",
    "MongoDB",
    "Express",
    "Angular",
    "Vue.js",
    "PHP",
    "Ruby on Rails",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
    "HTML",
    "CSS",
    "Tailwind",
  ];

  const skillSet = new Set(baseSkills.map((s) => s.toLowerCase()));
  const actualSkillNames = [...baseSkills];

  // Extract from existing jobs
  const jobs = await Job.find();
  for (const job of jobs) {
    if (job.skillsRequired && Array.isArray(job.skillsRequired)) {
      for (const skill of job.skillsRequired) {
        if (!skillSet.has(skill.toLowerCase())) {
          skillSet.add(skill.toLowerCase());
          actualSkillNames.push(skill);
        }
      }
    }
  }

  // Insert to DB
  let count = 0;
  for (const skill of actualSkillNames) {
    try {
      await MasterSkill.updateOne(
        { name: new RegExp(`^${skill}$`, "i") },
        { $setOnInsert: { name: skill } },
        { upsert: true },
      );
      count++;
    } catch (error) {
      console.error(`Error inserting ${skill}:`, error.message);
    }
  }

  console.log(`Successfully ensured ${count} skills in MasterSkill database.`);
  process.exit(0);
};

seedSkills();
