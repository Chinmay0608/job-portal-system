const Job = require("../models/job");
const User = require("../models/user");
const MasterSkill = require("../models/MasterSkill");
const { calculateJobMatches } = require("../services/jobMatchService");
const { clearCache } = require("../middleware/cacheMiddleware");
const asyncHandler = require("express-async-handler");

// Helper to escape regex characters and prevent ReDoS
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

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

  await clearCache("/api/jobs");

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
    source,
    isRemote,
    employmentType,
    page = 1,
    limit = 20,
  } = req.query;

  const query = { 
    isActive: { $ne: false },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user && user.hiddenJobs && user.hiddenJobs.length > 0) {
      query._id = { $nin: user.hiddenJobs };
    }
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    // TODO: Switch to $text search for better efficiency instead of $regex
    const searchCondition = {
      $or: [
        { title: { $regex: safeSearch, $options: "i" } },
        { company: { $regex: safeSearch, $options: "i" } },
        { keywords: { $regex: safeSearch, $options: "i" } }
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
    query.location = { $regex: escapeRegex(location), $options: "i" };
  }

  if (experience && experience !== "All Experience") {
    query.experienceRequired = experience;
  }
  
  if (source && source !== "All") {
    if (source === "Internal") {
      query.isExternal = { $ne: true };
    } else {
      query.source = source;
    }
  }

  if (isRemote === "true") {
    query.isRemote = true;
  }

  if (employmentType && employmentType !== "All") {
    query.employmentType = employmentType;
  }

  if (minSalary && !isNaN(minSalary)) {
    query.salaryMin = { $gte: Number(minSalary) };
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
  if (!user) return res.status(404).json({ message: "User not found" });

  // Show all active jobs (both internal and external)
  let query = { isActive: { $ne: false } };

  if (user && user.hiddenJobs && user.hiddenJobs.length > 0) {
    query._id = { $nin: user.hiddenJobs };
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

  if (title !== undefined && title.trim().length < 3) {
    res.status(400);
    throw new Error("Job title must be at least 3 characters");
  }
  if (salary !== undefined && Number(salary) < 0) {
    res.status(400);
    throw new Error("Salary must be a positive number");
  }
  if (description !== undefined && description.trim().length < 10) {
    res.status(400);
    throw new Error("Job description must be at least 10 characters");
  }

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

  await clearCache("/api/jobs");

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

  await User.updateMany(
    {},
    { $pull: { hiddenJobs: jobId, savedJobs: jobId } }
  );

  res.status(200).json({ message: "Job deleted successfully" });
});

/* ==========================
   HIDE JOB (CANDIDATE)
========================== */
const hideJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const jobExists = await Job.exists({ _id: jobId });
  if (!jobExists) return res.status(404).json({ message: "Job not found" });

  if (!user.hiddenJobs.includes(jobId)) {
    user.hiddenJobs.push(jobId);
    await user.save();
  }

  res.status(200).json({ message: "Job hidden successfully" });
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
  const safeQuery = escapeRegex(query.trim());
  const skills = await MasterSkill.find({
    name: { $regex: `^${safeQuery}`, $options: "i" },
  }).limit(10);

  // Map to clean string array of skill names
  const skillNames = skills.map((skill) => skill.name);

  res.status(200).json(skillNames);
});

// --- Career OS: Manual Sync Endpoint ---
const triggerManualSync = async (req, res, next) => {
  try {
    const syncService = require("../services/sync.service");
    const jobAggConfig = require("../config/jobAggregation");

    if (!jobAggConfig.isAggregationEnabled) {
      return res.status(400).json({
        success: false,
        message: "Job Aggregation is disabled globally via configuration.",
      });
    }

    // Fire and forget - do not await
    syncService.runAllSync().catch(err => {
      console.error("[Manual Sync] Background sync failed:", err.message);
    });

    res.status(202).json({
      success: true,
      message: "Job Sync started in the background. Check logs or Admin Dashboard for status.",
    });
  } catch (error) {
    next(error);
  }
};

// --- Career OS: Health / Status Endpoint ---
const getSyncStatus = async (req, res, next) => {
  try {
    const jobAggConfig = require("../config/jobAggregation");
    const Provider = require("../models/Provider");

    const providers = await Provider.find({}).lean();
    
    const statusData = {
      engine: jobAggConfig.useNewSyncEngine ? "NEW" : "LEGACY",
      aggregationEnabled: jobAggConfig.isAggregationEnabled,
      dryRun: jobAggConfig.syncDryRun,
      providers: providers.map((p) => ({
        name: p.name,
        enabled: p.isEnabled,
        status: p.lastStatus,
        lastSync: p.lastSyncAt,
        lastError: p.lastError,
        jobsFetched: p.totalJobsFetched,
      }))
    };

    res.status(200).json(statusData);
  } catch (error) {
    next(error);
  }
};

const triggerScheduledSync = async (req, res, next) => {
  const providedSecret = req.headers["x-sync-secret"];

  if (!process.env.SYNC_SECRET_KEY || providedSecret !== process.env.SYNC_SECRET_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const syncService = require("../services/sync.service");
    const jobAggConfig = require("../config/jobAggregation");

    if (!jobAggConfig.isAggregationEnabled) {
      return res.status(400).json({
        success: false,
        message: "Job Aggregation is disabled globally via configuration.",
      });
    }

    console.log("[Scheduled Sync] Triggered via external cron at", new Date().toISOString());

    // Await this one (unlike the manual endpoint) so GitHub Actions gets a
    // real pass/fail result and logs, rather than firing-and-forgetting.
    const metrics = await syncService.runAllSync();

    res.status(200).json({
      success: true,
      message: "Job sync completed.",
      metrics,
    });
  } catch (error) {
    console.error("[Scheduled Sync] Failed:", error.message);
    res.status(500).json({ success: false, message: "Sync failed", error: error.message });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  deleteJob,
  updateJob,
  hideJob,
  searchMasterSkills,
  triggerManualSync,
  triggerScheduledSync,
  getSyncStatus,
};

