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

// Mock Company Endpoints for Registry UI demo
const getCompaniesAdmin = asyncHandler(async (req, res) => {
  // In a real app, this would query a Company collection.
  // We'll return mock data for the UI to demonstrate the feature.
  const mockCompanies = [
    { _id: "c1", name: "Google", providerId: "google", status: "active", priority: 1, jobsCount: 42 },
    { _id: "c2", name: "Stripe", providerId: "stripe", status: "active", priority: 2, jobsCount: 15 },
    { _id: "c3", name: "Atolls", providerId: "atolls", status: "inactive", priority: 3, jobsCount: 0 }
  ];
  res.status(200).json(mockCompanies);
});

const updateCompanyAdmin = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Company updated (mock)" });
});

module.exports = {
  getConfig,
  setConfig,
  getCompaniesAdmin,
  updateCompanyAdmin
};
