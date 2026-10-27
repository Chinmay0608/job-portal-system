jest.mock("../models/user", () => ({ findById: jest.fn() }));
jest.mock("../models/job", () => ({}));
jest.mock("../models/MasterSkill", () => ({ findOne: jest.fn(), create: jest.fn() }));
jest.mock("../models/Application", () => ({ find: jest.fn(), deleteMany: jest.fn() }));
jest.mock("../services/resumeParserService", () => ({}));
jest.mock("../utils/logger", () => ({ info: jest.fn(), warn: jest.fn() }));

const User = require("../models/user");
const MasterSkill = require("../models/MasterSkill");
const Application = require("../models/Application");
const { updateProfile, completeOnboarding } = require("../controllers/userController");

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("user profile and onboarding controllers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires a full name when saving a profile", async () => {
    User.findById.mockResolvedValue({
      _id: "user-1", email: "person@example.com", name: "", location: "Remote",
      country: "India", education: "Bachelor's", experienceLevel: "Fresher",
      save: jest.fn(),
    });
    const res = response();

    await updateProfile({ user: { id: "user-1" }, body: { name: " " } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Full Name is required" });
  });

  it("rejects a blank location during onboarding", async () => {
    User.findById.mockResolvedValue({ _id: "user-1", save: jest.fn() });
    const res = response();

    await completeOnboarding({ user: { id: "user-1" }, body: { location: "  " } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Location is required" });
    expect(User.findById).toHaveBeenCalledWith("user-1");
  });

  it("saves onboarding fields, mirrors qualification to education, and returns application counts", async () => {
    const user = {
      _id: "user-1", name: "Person", email: "person@example.com", role: "candidate",
      skills: [], savedJobs: [], save: jest.fn().mockResolvedValue(undefined),
    };
    User.findById.mockResolvedValue(user);
    MasterSkill.findOne.mockResolvedValue({ name: "React" });
    Application.find.mockReturnValue({ populate: jest.fn().mockResolvedValue([
      { _id: "app-1", job: { _id: "job-1" } },
      { _id: "app-orphan", job: null },
    ]) });
    const res = response();

    await completeOnboarding({
      user: { id: "user-1" },
      body: { location: " Pune ", country: " India ", highestQualification: " Bachelor's ", experienceLevel: "2-5 Years", skills: [" React ", ""] },
    }, res);

    expect(user.location).toBe("Pune");
    expect(user.country).toBe("India");
    expect(user.highestQualification).toBe("Bachelor's");
    expect(user.education).toBe("Bachelor's");
    expect(user.skills).toEqual(["React"]);
    expect(user.hasCompletedOnboarding).toBe(true);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(Application.deleteMany).toHaveBeenCalledWith({ _id: { $in: ["app-orphan"] } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Onboarding complete",
      user: expect.objectContaining({ applicationsCount: 1, hasCompletedOnboarding: true }),
    }));
  });
});
