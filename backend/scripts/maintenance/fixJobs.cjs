require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/job');

async function updateJobs() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // 1. Update AI Engineer job
  const aiJob = await Job.findOne({ title: { $regex: /AI Engineer/i } });
  if (aiJob) {
    aiJob.createdAt = new Date(); // Make it new
    aiJob.description = `Are you passionate about building intelligent systems and solving complex problems with machine learning? We are looking for an innovative AI Engineer to join our core AI and Research team.

**Key Responsibilities:**
• Design, develop, and deploy scalable machine learning models and deep learning architectures into production environments.
• Collaborate with data scientists and software engineers to integrate AI features into our core product suite.
• Optimize existing neural network models for performance, latency, and resource utilization on edge devices and cloud infrastructure.
• Stay up-to-date with the latest advancements in natural language processing (NLP) and computer vision to drive continuous product innovation.

**Qualifications:**
• Bachelor's or Master's degree in Computer Science, Artificial Intelligence, Mathematics, or a related field.
• Proficiency in Python and deep learning frameworks such as TensorFlow, PyTorch, or Keras.
• Solid understanding of data structures, algorithms, and software engineering principles.
• Experience with cloud platforms (AWS, GCP, Azure) and ML deployment tools (Docker, Kubernetes, MLflow) is a strong plus.`;
    await aiJob.save();
    console.log("Updated AI Engineer job");
  }

  // 2. Fetch ~30 other external jobs and make them "new" (posted in last 2 days)
  const jobsToUpdate = await Job.find({ isExternal: true }).limit(30);
  let updatedCount = 0;
  for (let job of jobsToUpdate) {
    // Randomize createdAt between now and 2 days ago
    const offset = Math.floor(Math.random() * (2 * 24 * 60 * 60 * 1000));
    job.createdAt = new Date(Date.now() - offset);
    await job.save();
    updatedCount++;
  }
  console.log(`Updated \${updatedCount} external jobs to be "new"`);

  mongoose.disconnect();
}

updateJobs().catch(console.error);
