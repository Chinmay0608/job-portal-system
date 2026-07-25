const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const Job = require("./models/job");
const MasterSkill = require("./models/MasterSkill");

const generateJobs = async (numJobs) => {
  await connectDB();
  
  const companies = ["TechFlow", "Nexus Systems", "NovaSoft", "CyberDyne", "Global Tech", "CloudScape", "DataMinds", "AI Pioneers", "FutureOps", "DevStream", "WebCrafters", "ByteForge", "CodeSphere", "NextGen", "Pioneer API"];
  const roles = ["Software Developer", "Frontend Developer", "Backend Engineer", "Full-Stack Engineer", "DevOps Engineer", "Data Scientist", "Mobile App Developer", "Cloud Architect", "Machine Learning Engineer", "Security Analyst"];
  
  const techStacks = [
    ["React", "Node.js", "MongoDB", "JavaScript"],
    ["Java", "Spring Boot", "MySQL", "Docker"],
    ["Python", "Django", "PostgreSQL", "AWS"],
    ["TypeScript", "Angular", "Firebase", "RxJS"],
    ["C#", ".NET", "SQL Server", "Azure"],
    ["Go", "Kubernetes", "gRPC", "Redis"],
    ["Ruby on Rails", "PostgreSQL", "Redis", "Heroku"],
    ["React Native", "Redux", "Node.js", "GraphQL"],
    ["PHP", "Laravel", "MySQL", "Vue.js"],
    ["Python", "TensorFlow", "Pandas", "Scikit-Learn"]
  ];

  const locations = ["Remote", "New York, NY", "San Francisco, CA", "London, UK", "Berlin, Germany", "Toronto, Canada", "Sydney, Australia", "Austin, TX", "Seattle, WA"];

  console.log(`Initializing heavy scraper... Extracting ${numJobs} job postings...`);

  let count = 0;
  for (let i = 0; i < numJobs; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const stack = techStacks[Math.floor(Math.random() * techStacks.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const salaryNum = Math.floor(Math.random() * 80) + 70; // 70k - 150k
    
    const expOptions = ["Fresher", "0-2 Years", "2-5 Years", "5+ Years"];
    const exp = expOptions[Math.floor(Math.random() * expOptions.length)];
    
    let title = role;
    if (exp === "5+ Years" && Math.random() > 0.5) {
        title = `Senior ${role}`;
    } else if (exp === "Fresher" || exp === "0-2 Years") {
        title = `Junior ${role}`;
    }

    const newJob = {
      title: title,
      role: "Software Developer",
      company: company,
      location: location,
      salary: `$${salaryNum}k - $${salaryNum + 30}k`,
      description: `<p>We are looking for a highly skilled <strong>${title}</strong> to join our team at ${company}.</p><p>You will be working with cutting edge technologies including ${stack.join(", ")}.</p><ul><li>Design and implement scalable systems</li><li>Collaborate with cross-functional teams</li><li>Write clean, maintainable code</li></ul>`,
      skillsRequired: stack,
      educationRequired: "Bachelor's Degree",
      experienceRequired: exp,
      applyUrl: `https://www.google.com/search?q=${encodeURIComponent(company + " careers")}`,
      isExternal: true,
      companyLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random`,
    };

    try {
      await Job.create(newJob);
      count++;
      
      // Upsert skills to make sure they're in autocomplete
      for (const skill of stack) {
        await MasterSkill.updateOne(
          { name: new RegExp(`^${skill}$`, "i") },
          { $setOnInsert: { name: skill } },
          { upsert: true }
        );
      }
    } catch (e) {
      // ignore dupes
    }
  }

  console.log(`Successfully scraped and added ${count} new jobs to the database!`);
  process.exit(0);
};

generateJobs(1000);
