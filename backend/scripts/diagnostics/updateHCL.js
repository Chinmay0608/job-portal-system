const mongoose = require("mongoose");
const Job = require("./models/job");
require("dotenv").config();

async function updateHCL() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const job = await Job.findOne({ company: "HCL", title: /Java/i });
  if (job) {
    job.description = `<p>We are seeking a highly skilled and motivated <strong>Java Spring Boot Developer</strong> to join our dynamic engineering team at <strong>HCL</strong>.</p>
    
    <h3>About the Role</h3>
    <p>In this role, you will be responsible for designing, developing, and maintaining high-performance enterprise applications. You will collaborate closely with cross-functional teams including product managers, front-end developers, and QA engineers to deliver robust software solutions that meet business requirements.</p>

    <h3>Key Responsibilities</h3>
    <ul>
      <li>Design, build, and maintain efficient, reusable, and reliable Java code.</li>
      <li>Develop RESTful APIs and Microservices using Spring Boot.</li>
      <li>Ensure the best possible performance, quality, and responsiveness of applications.</li>
      <li>Identify bottlenecks and bugs, and devise solutions to these problems.</li>
      <li>Help maintain code quality, organization, and automation (CI/CD).</li>
      <li>Participate in architectural discussions and code reviews.</li>
    </ul>

    <h3>Requirements</h3>
    <ul>
      <li>Bachelor's degree in Computer Science, Engineering, or a related field.</li>
      <li>3+ years of proven hands-on Software Development experience.</li>
      <li>Strong proficiency in Java, with a solid understanding of object-oriented programming.</li>
      <li>Extensive experience with the Spring Framework (Spring Boot, Spring Security, Spring Data).</li>
      <li>Familiarity with various design and architectural patterns.</li>
      <li>Experience with database systems like PostgreSQL, MySQL, or MongoDB.</li>
      <li>Understanding of fundamental design principles behind a scalable application.</li>
    </ul>
    
    <h3>What We Offer</h3>
    <p>HCL offers a competitive salary, comprehensive health benefits, flexible working hours, and opportunities for continuous learning and career advancement. Join us to work on exciting projects that make a real-world impact!</p>`;
    
    await job.save();
    console.log("Successfully updated the HCL job description!");
  } else {
    console.log("HCL Job not found in database.");
  }
  
  process.exit(0);
}

updateHCL().catch(console.error);
