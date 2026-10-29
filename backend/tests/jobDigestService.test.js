const { runJobDigest, buildDigestHtml } = require("../services/jobDigestService");
const User = require("../models/user");
const Job = require("../models/job");
const sendEmail = require("../utils/sendEmail");

jest.mock("../models/user");
jest.mock("../models/job");
jest.mock("../utils/sendEmail");
jest.mock("../services/jobMatchService", () => ({
  calculateJobMatches: jest.fn().mockResolvedValue([
    {
      _id: "job1",
      title: "Frontend Developer",
      company: "Tech Corp",
      location: "Remote, India",
      salary: "₹12L–₹15L",
      matchPercentage: 85,
    },
  ]),
}));

describe("jobDigestService - Daily Email Alerts Rate Limiting & LinkedIn Style", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("buildDigestHtml generates valid LinkedIn-style email markup", () => {
    const html = buildDigestHtml("Alice", [
      {
        title: "Fullstack Engineer",
        company: "Acme Inc",
        location: "Bengaluru",
        salary: "₹15L–₹20L",
        matchPercentage: 90,
      },
    ], "alice@example.com", "Software Engineering");

    expect(html).toContain("Skill");
    expect(html).toContain("Bridge");
    expect(html).toContain("Your job alert for");
    expect(html).toContain("Software Engineering");
    expect(html).toContain("Acme Inc");
    expect(html).toContain("Fullstack Engineer");
    expect(html).toContain("See all jobs");
    expect(html).toContain("Manage alerts");
  });

  test("queries only candidates with lastJobDigestSentAt older than 24 hours (or null)", async () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockCandidates = [
      {
        _id: "cand1",
        name: "Bob",
        email: "bob@example.com",
        skills: ["React", "Node.js"],
        field: "Software Engineering",
        lastJobDigestSentAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        save: mockSave,
      },
    ];

    User.find = jest.fn().mockResolvedValue(mockCandidates);
    Job.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: "j1", title: "Frontend Developer", company: "Tech Corp", createdAt: new Date() },
        ]),
      }),
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      }),
    });
    sendEmail.mockResolvedValue({ messageId: "test-msg" });

    const result = await runJobDigest();

    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "candidate",
        emailNotificationsEnabled: { $ne: false },
        skills: { $exists: true, $ne: [] },
        $or: expect.arrayContaining([
          { lastJobDigestSentAt: { $exists: false } },
          { lastJobDigestSentAt: null },
          expect.objectContaining({
            lastJobDigestSentAt: { $lt: expect.any(Date) },
          }),
        ]),
      })
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      "bob@example.com",
      "Frontend Developer at Tech Corp",
      expect.any(String)
    );
    expect(mockSave).toHaveBeenCalled();
    expect(result.emailsSent).toBe(1);
  });

  test("skips candidate if lastJobDigestSentAt was less than 24 hours ago (safety guard)", async () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    const mockCandidates = [
      {
        _id: "cand2",
        name: "Charlie",
        email: "charlie@example.com",
        skills: ["Python"],
        field: "Data Science",
        lastJobDigestSentAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // only 3 hours ago
        save: mockSave,
      },
    ];

    User.find = jest.fn().mockResolvedValue(mockCandidates);
    sendEmail.mockResolvedValue(true);

    const result = await runJobDigest();

    // Must be skipped - strictly max 1 per day
    expect(sendEmail).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
    expect(result.emailsSent).toBe(0);
  });
});
