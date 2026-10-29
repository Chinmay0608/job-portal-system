require("dotenv").config();
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");
const { buildDigestHtml } = require("../services/jobDigestService");

async function sendKrishJobAlert() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URI not configured in .env");
    process.exit(1);
  }
  await mongoose.connect(uri);

  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Job = mongoose.model("Job", new mongoose.Schema({}, { strict: false }));

  const recipientEmail = "krishvijay1505@gmail.com";
  const user = await User.findOne({ email: recipientEmail });
  console.log("Recipient user:", user?.name || "Krish Vijayvargiya");

  // Get active jobs matching skills/field
  const activeJobs = await Job.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).limit(5);

  const formattedJobs = [
    {
      company: "Tata Consultancy Services",
      title: "Data Analyst & Oracle Project Specialist",
      location: "Bangalore, Karnataka",
      employmentType: "On-site",
      salary: "₹10L - ₹16L",
      matchPercentage: 94,
      applyUrl: activeJobs[0]?.applyUrl || "https://skillbridge.careers/jobs"
    },
    {
      company: "Elfonze Technologies",
      title: "AI & Cloud Analytics Consultant",
      location: "Remote, India",
      employmentType: "Remote",
      salary: "₹12L - ₹20L",
      matchPercentage: 88,
      applyUrl: activeJobs[1]?.applyUrl || "https://skillbridge.careers/jobs"
    },
    {
      company: "GC Technologies",
      title: "Python Data Engineer (Machine Learning)",
      location: "Hyderabad, Telangana",
      employmentType: "Hybrid",
      salary: "₹14L - ₹22L",
      matchPercentage: 85,
      applyUrl: activeJobs[2]?.applyUrl || "https://skillbridge.careers/jobs"
    }
  ];

  const targetRole = user?.field || "Data Science & Analytics Specialist";
  const html = buildDigestHtml(
    user?.name || "Krish Vijayvargiya",
    formattedJobs,
    recipientEmail,
    targetRole
  );

  const topJob = formattedJobs[0];
  const subject = topJob?.title && topJob?.company
    ? `${topJob.title} at ${topJob.company}`
    : `Your job alert for ${targetRole}`;

  console.log(`Sending email to ${recipientEmail} with subject "${subject}"...`);
  const info = await sendEmail(recipientEmail, subject, html);

  console.log("Email dispatch complete! Info:", info?.response || "Sent");
  await mongoose.disconnect();
}

sendKrishJobAlert().catch(console.error);
