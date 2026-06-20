const Job = require("../models/job");
const Application = require("../models/Application");
const User = require("../models/user");

/* ==========================
   CREATE JOB
========================== */
const createJob = async (req, res) => {
  try {
    const { title, role, company, location, salary, description } = req.body;

    if (!title || !role || !company || !location || !salary || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const job = await Job.create({
      title,
      role,
      company,
      location,
      salary,
      description,
      recruiter: req.user.id,
    });

    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   GET ALL JOBS
========================== */
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("recruiter", "name email");
    res.status(200).json({ jobs });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   GET RECRUITER JOBS
========================== */
const getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id });
    res.status(200).json({ jobs });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   GET RECOMMENDED JOBS
========================== */
const getRecommendedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const jobs = await Job.find();

    const recommendedJobs = jobs
      .map((job) => {
        const matchedSkills = job.skillsRequired.filter((skill) =>
          user.skills?.some(
            (userSkill) =>
              userSkill.toLowerCase() === skill.toLowerCase()
          )
        );

        const matchPercentage =
          job.skillsRequired.length > 0
            ? Math.round(
                (matchedSkills.length / job.skillsRequired.length) * 100
              )
            : 0;

        return {
          ...job.toObject(),
          matchPercentage,
        };
      })
      .filter((job) => job.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      jobs: recommendedJobs,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ==========================
   APPLY JOB
========================== */
const applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      candidate: req.user.id,
      job: jobId,
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    const application = await Application.create({
      candidate: req.user.id,
      job: jobId,
      resume: req.file?.path || "",
    });

    res.status(201).json({ message: "Applied successfully", application });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   UPDATE JOB
========================== */
const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, { new: true });

    res.status(200).json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   DELETE JOB
========================== */
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Job.findByIdAndDelete(jobId);

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  deleteJob,
  applyJob,
  updateJob,
};