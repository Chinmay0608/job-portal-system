require("dotenv").config({ path: "D:/Projects/MERN Project/job-portal/backend/.env" });
const mongoose = require("mongoose");
const fs = require("fs");
const Job = require("../models/job");

// Step 1: Ensure ABB is mapped in companyLogoHelper.js
const logoHelperPath = "D:/Projects/MERN Project/job-portal/backend/utils/companyLogoHelper.js";
let helperContent = fs.readFileSync(logoHelperPath, "utf8");
if (!helperContent.includes('"abb":')) {
  const abbEntries = `  "abb": "https://unavatar.io/abb.com",
  "abb india": "https://unavatar.io/abb.com",
  "abb group": "https://unavatar.io/abb.com",\n`;
  helperContent = helperContent.replace(
    '  "swiggy": "https://unavatar.io/swiggy.com",\n',
    `  "swiggy": "https://unavatar.io/swiggy.com",\n${abbEntries}`
  );
  fs.writeFileSync(logoHelperPath, helperContent, "utf8");
  console.log("Added ABB to VERIFIED_ENTERPRISE_MAP in companyLogoHelper.js");
}

const { resolveCompanyLogo } = require("../utils/companyLogoHelper");

const abbJobData = {
  title: "Software Engineering Intern (Multiple Roles)",
  role: "Software Engineering Intern - 2027 Batch",
  company: "ABB India",
  location: "PAN India (Bengaluru, Hyderabad, Vadodara)",
  salary: "₹80,000 / month (₹18 LPA PPO)",
  salaryMin: 960000,
  salaryMax: 1800000,
  salaryCurrency: "INR",
  applyUrl: "https://careers.abb/global/en/home",
  isExternal: true,
  isActive: true,
  companyLogo: resolveCompanyLogo("ABB India") || "https://unavatar.io/abb.com",
  description: `<h3>Standard Job Title</h3>
<p>Software Engineering Intern (Multiple Roles - Electrification, Robotics & Industrial Automation)</p>

<h3>Role Summary</h3>
<p>ABB is a pioneering technology leader in electrification and automation, enabling a more sustainable and resource-efficient future. As a Software Engineering Intern at ABB India, you will contribute to cutting-edge software platforms, industrial IoT solutions, robotics control systems, and enterprise grid software that power critical global infrastructure.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Design, code, and test high-performance software components in C++, C#, Java, Python, or modern web technologies (React, TypeScript).</li>
  <li>Develop and maintain industrial communication services, telemetry pipelines, and cloud/edge integration modules (OPC UA, MQTT, REST).</li>
  <li>Collaborate with cross-functional R&D squads, system architects, and test engineers to implement new product features within an Agile environment.</li>
  <li>Write automated unit and integration tests to ensure deterministic reliability and high code quality.</li>
  <li>Participate in architectural reviews, peer code reviews, and defect triage sessions.</li>
</ul>

<h3>Required Qualifications</h3>
<ul>
  <li>Pursuing B.E. / B.Tech or Integrated M.Tech in Computer Science, Information Technology, Software Engineering, Electronics & Communication, or Electrical Engineering (Graduating in 2027).</li>
  <li>Academic Track Record: Minimum 60% aggregate (or 6.0+ CGPA) across 10th, 12th/Diploma, and undergraduate semesters with no active backlogs.</li>
  <li>Solid grounding in Computer Science fundamentals: Data Structures, Algorithms, Object-Oriented Programming (OOP), and Operating Systems.</li>
  <li>Hands-on coding proficiency in at least one primary programming language: C++, C#, Java, or Python.</li>
  <li>Basic understanding of database management systems (SQL/NoSQL) and version control using Git.</li>
</ul>

<h3>Preferred Qualifications</h3>
<ul>
  <li>Exposure to Industrial IoT, edge computing, distributed microservices, or cloud platforms (Azure/AWS).</li>
  <li>Active participation in competitive programming, hackathons, or open-source software projects.</li>
  <li>Strong analytical aptitude, self-motivation, and eagerness to solve complex real-world engineering problems.</li>
</ul>

<h3>Selection Process</h3>
<ul>
  <li><strong>Stage 1 - Online Assessment (OA):</strong> Aptitude, Core Technical MCQs, and Coding Problems.</li>
  <li><strong>Stage 2 - Technical Discussion:</strong> Core CS fundamentals, project architecture review, and live problem-solving.</li>
  <li><strong>Stage 3 - HR Discussion:</strong> Cultural fitment, behavioral evaluation, and internship/PPO terms.</li>
</ul>

<h3>Compensation and Benefits</h3>
<p>Internship stipend of ₹80,000 per month with a full-time Pre-Placement Offer (PPO) conversion opportunity of ₹18 LPA CTC based on internship performance.</p>

<h3>Work Arrangement and Location</h3>
<p>PAN India opportunities with primary technical and R&D centers in Bengaluru, Hyderabad, and Vadodara (Hybrid / In-Person depending on business unit).</p>`,
  descriptionEnglish: "ABB India is hiring Software Engineering Interns (Multiple Roles) for the 2027 batch. Stipend: ₹80,000/month with ₹18 LPA PPO. Eligible: 2027 graduates with 60%+ aggregate and no backlogs.",
  isFullDescription: true,
  skillsRequired: [
    "C++",
    "Java",
    "Python",
    "C#",
    "Data Structures",
    "Algorithms",
    "OOP",
    "SQL",
    "Git",
    "Industrial IoT"
  ],
  educationRequired: "B.Tech / B.E / M.Tech in CSE / IT / ECE / EEE (2027 Batch)",
  experienceRequired: "Fresher",
  source: "CAMPUS_REFERRAL",
  externalId: "ABB-SWE-INTERN-2027",
  employmentType: "Internship (+PPO)",
  isRemote: false,
  domain: "Software Engineering",
  seniorityLevel: "Intern / Fresher",
  keywords: [
    "ABB",
    "ABB India",
    "Software Engineering Intern",
    "2027 Batch",
    "80000 Stipend",
    "18 LPA",
    "PPO",
    "PAN India",
    "Bengaluru",
    "Hyderabad"
  ]
};

async function postJob() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.\n");

    const existing = await Job.findOne({
      $or: [
        { externalId: abbJobData.externalId },
        { title: abbJobData.title, company: "ABB India" }
      ]
    });

    if (existing) {
      const updated = await Job.findByIdAndUpdate(existing._id, abbJobData, { new: true });
      console.log(`[UPDATED] ${updated.company} - ${updated.title}`);
      console.log(`Record ID: ${updated._id}`);
      console.log(`Logo: ${updated.companyLogo}`);
      console.log(`Salary: ${updated.salary}`);
    } else {
      const created = await Job.create(abbJobData);
      console.log(`[CREATED] ${created.company} - ${created.title}`);
      console.log(`Record ID: ${created._id}`);
      console.log(`Logo: ${created.companyLogo}`);
      console.log(`Salary: ${created.salary}`);
    }

    console.log("\nABB India opening is now LIVE on the production app!");
    process.exit(0);
  } catch (err) {
    console.error("Error posting ABB job:", err);
    process.exit(1);
  }
}

postJob();
