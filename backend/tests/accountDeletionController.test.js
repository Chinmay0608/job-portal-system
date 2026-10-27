jest.mock("../models/user", () => ({ findById: jest.fn(), deleteOne: jest.fn() }));
jest.mock("../models/AccountDeletionRequest", () => {
  const Request = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = "request-1";
    this.save = jest.fn().mockResolvedValue(this);
  });
  Request.findOne = jest.fn();
  Request.findOneAndUpdate = jest.fn();
  Request.deleteOne = jest.fn();
  return Request;
});
jest.mock("../models/Application", () => ({ deleteMany: jest.fn() }));
jest.mock("../models/job", () => ({ find: jest.fn(), deleteMany: jest.fn() }));
jest.mock("../middleware/securityAuditMiddleware", () => ({ logSecurityEvent: jest.fn() }));
jest.mock("../utils/sendEmail", () => jest.fn());
const crypto = require("crypto");
const User = require("../models/user");
const AccountDeletionRequest = require("../models/AccountDeletionRequest");
const Application = require("../models/Application");
const Job = require("../models/job");
const sendEmail = require("../utils/sendEmail");
const { requestOtp, confirmOtp, decideRequest } = require("../controllers/accountDeletionController");

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("account deletion controller", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends an OTP to the signed-in user's email and stores only its hash", async () => {
    const user = { _id: "user-1", email: "person@example.com", role: "candidate" };
    User.findById.mockResolvedValue(user);
    AccountDeletionRequest.findOne.mockResolvedValue(null);
    sendEmail.mockResolvedValue(true);
    const randomInt = jest.spyOn(crypto, "randomInt").mockReturnValue(123456);
    const res = response();

    await requestOtp({ user: { id: "user-1" }, body: { email: " Person@Example.com ", reason: "No longer needed" } }, res);

    const savedRequest = AccountDeletionRequest.mock.instances[0];
    expect(savedRequest.otpHash).toBe(crypto.createHash("sha256").update("123456").digest("hex"));
    expect(savedRequest.otpHash).not.toContain("123456");
    expect(savedRequest.otpExpires.getTime()).toBeGreaterThan(Date.now());
    expect(sendEmail).toHaveBeenCalledWith("person@example.com", expect.any(String), expect.stringContaining("123456"));
    expect(res.json).toHaveBeenCalledWith({ message: "Verification code sent to your email." });
    randomInt.mockRestore();
  });

  it("rejects expired or incorrect OTPs without marking the request verified", async () => {
    const request = {
      otpHash: crypto.createHash("sha256").update("654321").digest("hex"),
      otpExpires: new Date(Date.now() + 60_000),
      save: jest.fn(),
    };
    AccountDeletionRequest.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(request) });
    const res = response();

    await confirmOtp({ user: { id: "user-1" }, body: { otp: "000000" } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired verification code." });
    expect(request.save).not.toHaveBeenCalled();
  });

  it("deletes a candidate and their applications only after admin approval", async () => {
    const request = { _id: "request-1", user: "user-1", email: "person@example.com" };
    const user = { _id: "user-1", email: "person@example.com", role: "candidate" };
    AccountDeletionRequest.findOneAndUpdate.mockResolvedValue(request);
    User.findById.mockResolvedValue(user);
    sendEmail.mockResolvedValue(true);
    const res = response();

    await decideRequest({ params: { id: "request-1" }, body: { decision: "approved" } }, res);

    expect(Application.deleteMany).toHaveBeenCalledWith({ candidate: "user-1" });
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: "user-1" });
    expect(Job.find).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: "Request approved.", request });
  });

  it("rejects invalid admin decisions before updating a request", async () => {
    const res = response();
    await decideRequest({ params: { id: "request-1" }, body: { decision: "delete" } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(AccountDeletionRequest.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
