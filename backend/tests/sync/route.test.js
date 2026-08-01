const request = require("supertest");
const express = require("express");
const jobRoutes = require("../../routes/jobRoutes");
const { protect, authorizeRoles, optionalAuth } = require("../../middleware/authMiddleware");
const { cacheMiddleware } = require("../../middleware/cacheMiddleware");

jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorizeRoles: () => (req, res, next) => next(),
}));

jest.mock("../../middleware/cacheMiddleware", () => ({
  cacheMiddleware: () => (req, res, next) => next(),
}));

jest.mock("../../middleware/multer", () => ({
  single: () => (req, res, next) => next(),
}));

jest.mock("../../controllers/jobController", () => ({
  triggerManualSync: (req, res) => res.status(202).json({ success: true }),
  getSyncStatus: (req, res) => res.status(200).json({ engine: "NEW" }),
  createJob: jest.fn(),
  getAllJobs: jest.fn(),
  getRecruiterJobs: jest.fn(),
  getRecommendedJobs: jest.fn(),
  deleteJob: jest.fn(),
  updateJob: jest.fn(),
  hideJob: jest.fn(),
  searchMasterSkills: jest.fn()
}));

const app = express();
app.use(express.json());
app.use("/api/jobs", jobRoutes);

describe("Job Routes - Sync Endpoints", () => {
  it("should respond to POST /api/jobs/sync", async () => {
    const res = await request(app).post("/api/jobs/sync");
    expect(res.statusCode).toBe(202);
  });

  it("should respond to GET /api/jobs/sync/status", async () => {
    const res = await request(app).get("/api/jobs/sync/status");
    expect(res.statusCode).toBe(200);
    expect(res.body.engine).toBe("NEW");
  });
});
