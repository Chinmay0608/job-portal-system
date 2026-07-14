require("dotenv").config();
const mongoose = require("mongoose");
const MasterSkill = require("./models/MasterSkill");

const initialSkills = [
  "Java", "Spring Boot", "React", "Node.js", "Express", "MongoDB", "JavaScript", 
  "TypeScript", "Python", "SQL", "REST APIs", "Maven", "Git", "C++", "C#", "Go", 
  "Rust", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "CI/CD"
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB for seeding...");
    await MasterSkill.deleteMany({}); // Clears existing items
    const data = initialSkills.map(name => ({ name }));
    await MasterSkill.insertMany(data);
    console.log("Successfully seeded master skills! 🌱");
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });