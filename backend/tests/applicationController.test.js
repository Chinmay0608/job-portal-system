jest.mock("../models/Application", () => ({ find: jest.fn(), deleteMany: jest.fn() }));
jest.mock("../models/job", () => ({}));
jest.mock("../models/user", () => ({}));
jest.mock("../utils/sendEmail", () => jest.fn());
jest.mock("../models/Notification", () => ({}));

const Application = require("../models/Application");
const { getMyApplications } = require("../controllers/applicationController");

describe("getMyApplications", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes orphaned application records and paginates only applications with jobs", async () => {
    const validApps = [
      { _id: "app-1", job: { _id: "job-1" } },
      { _id: "app-2", job: { _id: "job-2" } },
      { _id: "app-3", job: { _id: "job-3" } },
    ];
    const apps = [validApps[0], { _id: "app-orphan", job: null }, ...validApps.slice(1)];
    const query = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(apps),
    };
    Application.find.mockReturnValue(query);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await getMyApplications({ user: { id: "candidate-1" }, query: { page: "2", limit: "1" } }, res);

    expect(Application.find).toHaveBeenCalledWith({ candidate: "candidate-1" });
    expect(Application.deleteMany).toHaveBeenCalledWith({ _id: { $in: ["app-orphan"] } });
    expect(res.json).toHaveBeenCalledWith({
      applications: [validApps[1]], totalApplications: 3, totalPages: 3, currentPage: 2,
    });
  });
});
