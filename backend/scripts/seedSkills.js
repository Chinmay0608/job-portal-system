const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("../config/db");
const Job = require("../models/job");
const MasterSkill = require("../models/MasterSkill");

const seedSkills = async () => {
  await connectDB();

  // Basic tech stack that should always be present
  const baseSkills = [
    "Java", "Python", "JavaScript", "TypeScript", "React", "Node.js", "C++", "C#", 
    "AWS", "Docker", "Kubernetes", "SQL", "MongoDB", "Express", "Angular", "Vue.js", 
    "PHP", "Ruby on Rails", "Go", "Rust", "Swift", "Kotlin", "HTML", "CSS", "Tailwind",
    "Next.js", "Svelte", "Redux", "GraphQL", "Webpack", "Babel", "SCSS", "LESS", 
    "Bootstrap", "Material UI", "Chakra UI", "Three.js", "WebGL", "Figma", 
    "Adobe XD", "UI/UX Design", "Wireframing", "Prototyping",
    "Spring Boot", "Django", "Flask", "FastAPI", "Laravel", "ASP.NET", "NestJS", 
    "Apollo", "gRPC", "REST APIs", "Microservices", "GraphQL APIs",
    "PostgreSQL", "MySQL", "SQLite", "Oracle", "Redis", "Cassandra", "DynamoDB", 
    "Neo4j", "Elasticsearch", "Firebase", "Supabase", "MariaDB", "Prisma", "Mongoose",
    "Azure", "Google Cloud Platform (GCP)", "Terraform", "Ansible", "Chef", "Puppet", 
    "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Vercel", "Heroku", 
    "Nginx", "Apache", "Linux", "Bash", "Shell Scripting", "PowerShell",
    "React Native", "Flutter", "Dart", "Objective-C", "Android SDK", "iOS SDK", "Expo",
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras", "Hadoop", 
    "Spark", "Kafka", "Airflow", "Tableau", "Power BI", "Deep Learning", 
    "Natural Language Processing", "Computer Vision", "Data Engineering", "MATLAB", "R",
    "Git", "JIRA", "Confluence", "Agile", "Scrum", "Kanban", "TDD", "BDD", "CI/CD",
    "Penetration Testing", "Ethical Hacking", "Cryptography", "Network Security", 
    "OWASP", "SOC 2", "Identity and Access Management (IAM)",
    "Scala", "Perl", "Haskell", "Lua", "Solidity", "Web3", "Smart Contracts", 
    "Blockchain", "Game Development", "Unity", "Unreal Engine", "AR/VR",
    "Project Management", "Team Leadership", "Problem Solving", "Communication", 
    "Time Management", "Critical Thinking"
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

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Insert to DB
  let count = 0;
  for (const skill of actualSkillNames) {
    try {
      await MasterSkill.updateOne(
        { name: new RegExp(`^${escapeRegex(skill)}$`, "i") },
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
