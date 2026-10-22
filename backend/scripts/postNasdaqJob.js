require("dotenv").config({ path: "D:/Projects/MERN Project/job-portal/backend/.env" });
const mongoose = require("mongoose");
const Job = require("../models/job");

async function postJob() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    const jobData = {
      title: "Nasdaq Campus Program - 2027",
      role: "Software Engineering / AI / Data Intern (2027 Batch)",
      company: "Nasdaq",
      location: "Bangalore, Karnataka, India",
      salary: "Paid Internship (Competitive Stipend)",
      applyUrl: "https://nasdaq.wd1.myworkdayjobs.com/en-US/Global_External_Site/details/Nasdaq-Campus-Program----2027_R0027122-2?Location_Country=c4f78be1a8f14da0ab49ce1162348a5e",
      isExternal: true,
      isActive: true,
      companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Nasdaq_Logo.svg/1200px-Nasdaq_Logo.svg.png",
      description: `### Why Nasdaq?
You may think of Nasdaq as just a stock exchange, but think again. We are a global technology company championing inclusive growth and prosperity.

### Be part of our Global Campus Program (2027 Batch):
The Campus Program in India provides students with outstanding opportunities through an immersive 6-month internship from January to June 2027.

You will gain hands-on experience working on complex fintech and capital market projects alongside senior engineers and cross-functional departments.

### Available Roles & Tracks:
- Software Development Intern
- AI/ML Intern
- Quality Engineering Intern
- Data Science Intern
- Data Engineer Intern
- Product & Project Management Intern

### Eligibility & Qualifications:
- **Education:** Students entering their final year of a degree program (graduating 2027) in Computer Science, Artificial Intelligence, IT, Data Science, Machine Learning, MBA/PGDM, or a related field.
- **Technical Skills:** Exposure to at least three of the following: Java, Python, React, JavaScript, C/C++, SQL, HTML, Tableau, AWS, or related technologies.
- **Preferred Interests:** An understanding of or interest in Artificial Intelligence, Machine Learning, LLMs, Automation, Testing, or Financial/Capital Markets.

### Program Details:
- **Duration:** 6 months (Full-Time, January to June 2027)
- **Location:** Bangalore, Karnataka (Hybrid)
- **Application Deadline:** October 25, 2026 (Job ID: R0027122)
- High-performing interns receive full-time placement/conversion opportunities upon graduation.`,
      descriptionEnglish: `Nasdaq Campus Program - 2027. 6-month immersive internship for 2027 graduates in Bangalore. Roles include Software Development, AI/ML, Quality Engineering, Data Science, and Data Engineering. Required skills: Java, Python, React, C++, SQL, AWS.`,
      isFullDescription: true,
      skillsRequired: [
        "Java",
        "Python",
        "React",
        "JavaScript",
        "C++",
        "SQL",
        "AWS",
        "Machine Learning",
        "Data Engineering",
        "Fintech"
      ],
      educationRequired: "B.Tech / B.E / M.Tech / MCA (2027 Batch - Final Year Entering)",
      experienceRequired: "Fresher",
      source: "WORKDAY",
      externalId: "R0027122",
      employmentType: "Internship (6 Months)",
      isRemote: false,
      domain: "Software Engineering",
      seniorityLevel: "Intern / Fresher",
      keywords: ["Nasdaq", "Campus Program 2027", "Internship", "Bangalore", "Freshers", "2027 Batch", "AI/ML", "Software Engineer"]
    };

    // Check if it already exists by externalId or title + company
    const existing = await Job.findOne({
      $or: [
        { externalId: "R0027122" },
        { title: jobData.title, company: "Nasdaq" }
      ]
    });

    if (existing) {
      console.log("Job already exists in database. Updating record ID:", existing._id);
      const updated = await Job.findByIdAndUpdate(existing._id, jobData, { new: true });
      console.log("Successfully updated Nasdaq job posting:", updated._id);
    } else {
      const created = await Job.create(jobData);
      console.log("Successfully created and posted new Nasdaq job posting:", created._id);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error posting job:", err);
    process.exit(1);
  }
}

postJob();
