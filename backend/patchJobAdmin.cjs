const fs = require('fs');
const path = require('path');
const controllerPath = 'D:/MERN Project/job-portal/backend/controllers/jobController.js';

let content = fs.readFileSync(controllerPath, 'utf8');

const getJobsAdminLogic = `
const getJobsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { source, status, search } = req.query;

  const filter = {};
  if (source === "internal") filter.isExternal = { $ne: true };
  if (source === "external") filter.isExternal = true;

  if (status === "active") filter.status = "open";
  if (status === "inactive") filter.status = "closed";

  if (search) {
    const searchRegex = new RegExp(search, "i");
    filter.$or = [
      { title: searchRegex },
      { company: searchRegex },
      { location: searchRegex }
    ];
  }

  // Calculate stats
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: "open" });
  const externalJobs = await Job.countDocuments({ isExternal: true });
  const internalJobs = await Job.countDocuments({ isExternal: { $ne: true } });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jobsAddedToday = await Job.countDocuments({ createdAt: { $gte: today } });

  const stats = {
    total: totalJobs,
    active: activeJobs,
    external: externalJobs,
    internal: internalJobs,
    addedToday: jobsAddedToday
  };

  // Get paginated jobs
  const skip = (page - 1) * limit;
  let jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Aggregate application counts
  const Application = require('../models/application');
  const jobIds = jobs.map(j => j._id);
  const applicationCounts = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$job", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  applicationCounts.forEach(item => {
    countMap[item._id.toString()] = item.count;
  });

  jobs = jobs.map(j => ({
    ...j,
    applicationCount: countMap[j._id.toString()] || 0
  }));

  const totalFiltered = await Job.countDocuments(filter);
  const totalPages = Math.ceil(totalFiltered / limit) || 1;

  res.status(200).json({
    jobs,
    stats,
    page,
    totalPages,
    totalJobs: totalFiltered
  });
});
`;

// Insert getJobsAdmin before module.exports
content = content.replace(/module\.exports\s*=\s*\{/, getJobsAdminLogic + '\nmodule.exports = {\n  getJobsAdmin,');

fs.writeFileSync(controllerPath, content);
console.log('Added getJobsAdmin to jobController.js');
