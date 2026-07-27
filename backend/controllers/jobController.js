const Job = require("../models/job");
const User = require("../models/user");
const MasterSkill = require("../models/MasterSkill");
const { calculateJobMatches } = require("../services/jobMatchService");
const asyncHandler = require("express-async-handler");

/* ==========================
   CREATE JOB
========================== */
const createJob = asyncHandler(async (req, res) => {
  const { title, role, company, location, salary, description } = req.body;

  if (!title || !role || !company || !location || !salary || !description) {
    res.status(400);
    throw new Error("All fields are required");
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
});

/* ==========================
   GET ALL JOBS
========================== */
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    search,
    location,
    minSalary,
    experience,
    page = 1,
    limit = 20,
  } = req.query;

  const query = { isActive: { $ne: false } };

  // 1. Filter out external jobs unless the user is the designated personal candidate
  let isPersonalCandidate = false;

  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user && user.jobPreferences && user.jobPreferences.externalOnly) {
      isPersonalCandidate = true;
    }
  }

  if (isPersonalCandidate) {
    query.isExternal = true; // Only show real external jobs for the candidate
    // Enforce International Visa / Remote Rule
    query.$or = [
      { location: { $regex: /india|worldwide|anywhere|global/i } },
      { location: { $regex: /remote/i } },
      { description: { $regex: /visa|sponsorship|sponsor|relocation/i } },
    ];
  } else {
    query.isExternal = { $ne: true }; // Only show mock/internal jobs for others
  }

  if (search) {
    // If $or already exists (from visa logic), we must use $and to combine them
    const searchCondition = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ],
    };

    if (query.$or) {
      query.$and = [searchCondition, { $or: query.$or }];
      delete query.$or;
    } else {
      query.$or = searchCondition.$or;
    }
  }

  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  if (experience && experience !== "All Experience") {
    // Check the experienceRequired field
    query.experienceRequired = experience;
  }

  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const perPage = Number(limit) > 0 ? Number(limit) : 20;

  const totalJobs = await Job.countDocuments(query);
  const jobs = await Job.find(query)
    .populate("recruiter", "name email")
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  const totalPages = Math.ceil(totalJobs / perPage) || 1;

  res.status(200).json({
    jobs,
    totalJobs,
    totalPages,
    currentPage,
  });
});

/* ==========================
   GET RECRUITER JOBS
========================== */
const getRecruiterJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const perPage = Number(limit) > 0 ? Number(limit) : 20;

  const query = { recruiter: req.user.id };

  const totalJobs = await Job.countDocuments(query);
  const jobs = await Job.find(query)
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  const totalPages = Math.ceil(totalJobs / perPage) || 1;

  res.status(200).json({ 
    jobs,
    totalJobs,
    totalPages,
    currentPage,
  });
});

/* ==========================
   GET RECOMMENDED JOBS
========================== */
const getRecommendedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // Filter out external jobs unless it's the personal candidate
  let query = { isActive: { $ne: false } };
  
  if (user && user.jobPreferences && user.jobPreferences.externalOnly) {
    query.isExternal = true;
    // Enforce International Visa / Remote Rule
    query.$or = [
      { location: { $regex: /india|worldwide|anywhere|global/i } },
      { location: { $regex: /remote/i } },
      { description: { $regex: /visa|sponsorship|sponsor|relocation/i } },
    ];
  } else {
    query.isExternal = { $ne: true };
  }

  const jobs = await Job.find(query);

  const recommendedJobs = calculateJobMatches(jobs, user.skills || []);

  res.status(200).json({
    jobs: recommendedJobs,
  });
});

/* ==========================
   UPDATE JOB
========================== */
const updateJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { title, role, company, location, salary, description, experienceRequired, skillsRequired } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.recruiter.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (role !== undefined) updateData.role = role;
  if (company !== undefined) updateData.company = company;
  if (location !== undefined) updateData.location = location;
  if (salary !== undefined) updateData.salary = salary;
  if (description !== undefined) updateData.description = description;
  if (experienceRequired !== undefined) updateData.experienceRequired = experienceRequired;
  if (skillsRequired !== undefined) updateData.skillsRequired = skillsRequired;

  const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, {
    new: true,
  });

  res
    .status(200)
    .json({ message: "Job updated successfully", job: updatedJob });
});

/* ==========================
   DELETE JOB
========================== */
const deleteJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.recruiter.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }

  await Job.findByIdAndDelete(jobId);

  res.status(200).json({ message: "Job deleted successfully" });
});

/* ==========================
   SEARCH MASTER SKILLS
========================== */
const searchMasterSkills = asyncHandler(async (req, res) => {
  const { query } = req.query;

  // Return empty array if query is missing or empty
  if (!query || query.trim() === "") {
    return res.status(200).json([]);
  }

  // Case-insensitive anchored regex search for fast performance
  const skills = await MasterSkill.find({
    name: { $regex: `^${query.trim()}`, $options: "i" },
  }).limit(10);

  // Map to clean string array of skill names
  const skillNames = skills.map((skill) => skill.name);

  res.status(200).json(skillNames);
});

module.exports = {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  deleteJob,
  updateJob,
  searchMasterSkills,
};
