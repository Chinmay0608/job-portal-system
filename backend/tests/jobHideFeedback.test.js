jest.mock("../models/job", () => ({ exists: jest.fn() }));
jest.mock("../models/user", () => ({ findById: jest.fn() }));

const Job = require("../models/job");
const User = require("../models/user");
const { hideJob } = require("../controllers/jobController");

describe("hideJob feedback", () => {
  let req;
  let res;
  let user;

  beforeEach(() => {
    user = {
      hiddenJobs: [],
      hiddenJobFeedback: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    req = {
      params: { jobId: "job-123" },
      body: { reason: "tech_stack_mismatch", details: "" },
      user: { id: "user-123" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    User.findById.mockResolvedValue(user);
    Job.exists.mockResolvedValue(true);
  });

  it("stores the selected reason when hiding a job", async () => {
    await hideJob(req, res);

    expect(user.hiddenJobs).toEqual(["job-123"]);
    expect(user.hiddenJobFeedback).toEqual([
      expect.objectContaining({
        jobId: "job-123",
        reason: "tech_stack_mismatch",
        details: "",
      }),
    ]);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("requires details when the reason is other", async () => {
    req.body = { reason: "other", details: " " };

    await hideJob(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(user.save).not.toHaveBeenCalled();
  });
});
