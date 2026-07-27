const Job = require("../models/job");
const User = require("../models/user");
const MasterSkill = require("../models/MasterSkill");
const jwt = require("jsonwebtoken");
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
  const personalEmail =
    process.env.PERSONAL_CANDIDATE_EMAIL || "myemail@example.com";
  let isPersonalCandidate = false;

  let userSkills = [];
  if (req.cookies && req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.email === personalEmail) {
        isPersonalCandidate = true;
        userSkills = user.skills || [];
      }
    } catch (e) {
      // Ignore invalid token
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
  const jobs = await Job.find({ recruiter: req.user.id });
  res.status(200).json({ jobs });
});

/* ==========================
   GET RECOMMENDED JOBS
========================== */
const getRecommendedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  // Filter out external jobs unless it's the personal candidate
  const personalEmail =
    process.env.PERSONAL_CANDIDATE_EMAIL || "myemail@example.com";
  let query = { isActive: { $ne: false } };
  if (user.email === personalEmail) {
    query.isExternal = true;
    // Enforce International Visa / Remote Rule
    query.$or = [
      { location: { $regex: /india/i } },
      { location: { $regex: /remote/i } },
      { description: { $regex: /visa|sponsorship|sponsor|relocation/i } },
    ];
  } else {
    query.isExternal = { $ne: true };
  }

  const jobs = await Job.find(query);

  const recommendedJobs = jobs
    .map((job) => {
      const skillsRequired = Array.isArray(job.skillsRequired)
        ? job.skillsRequired
        : [];

      const matchedSkills = skillsRequired.filter((skill) =>
        user.skills?.some(
          (userSkill) => userSkill.toLowerCase() === skill.toLowerCase(),
        ),
      );

      const matchPercentage =
        skillsRequired.length > 0
          ? Math.round((matchedSkills.length / skillsRequired.length) * 100)
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
});

/* ==========================
   UPDATE JOB
========================== */
const updateJob = asyncHandler(async (req, res) => {
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

  const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, {
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
