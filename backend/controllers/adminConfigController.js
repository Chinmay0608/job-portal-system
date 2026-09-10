const asyncHandler = require("express-async-handler");
const SystemConfig = require("../models/SystemConfig");
// Future expansion: import Company model when building out the company registry

// @desc    Get all system configurations
// @route   GET /api/config
// @access  Private/Admin
const getConfig = asyncHandler(async (req, res) => {
  const configs = await SystemConfig.find().lean();
  res.status(200).json(configs);
});

// @desc    Update a specific system config
// @route   PUT /api/config/:key
// @access  Private/Admin
const setConfig = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  let config = await SystemConfig.findOne({ key });
  if (config) {
    config.value = value;
    if (description) config.description = description;
    await config.save();
  } else {
    config = await SystemConfig.create({ key, value, description });
  }

  res.status(200).json(config);
});

const Company = require("../models/Company");

// Real Company Endpoints for Registry UI
const getCompaniesAdmin = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const companies = await Company.find()
    .select("name providerIdentifier platformRef status priority")
    .sort({ priority: -1, name: 1 })
    .limit(limit)
    .lean();

  const mapped = companies.map(c => ({
    _id: c._id,
    name: c.name,
    providerId: c.providerIdentifier || c.platformRef || "direct",
    priority: c.priority || 5,
    status: c.status?.toLowerCase() === 'active' || c.status?.toLowerCase() === 'verified' ? 'active' : 'inactive'
  }));
  res.status(200).json(mapped);
});

const updateCompanyAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority } = req.body;
  const updateData = {};
  if (status) {
    updateData.status = status.toLowerCase() === 'active' ? 'ACTIVE' : 'DORMANT';
  }
  if (priority !== undefined) {
    updateData.priority = priority;
  }
  const company = await Company.findByIdAndUpdate(id, updateData, { new: true });
  res.status(200).json({ message: "Company updated", company });
});

const triggerJobDigestManually = asyncHandler(async (req, res) => {
  const { runJobDigest } = require("../services/jobDigestService");
  runJobDigest().catch((err) => console.error("[Job Digest] Manual trigger failed:", err.message));
  res.status(202).json({ message: "Job digest run started in the background." });
});

module.exports = {
  getConfig,
  setConfig,
  getCompaniesAdmin,
  updateCompanyAdmin,
  triggerJobDigestManually,
};
