const nodemailer = require("nodemailer");
const sendEmail = require("../utils/sendEmail");

jest.mock("nodemailer");

describe("SendEmail Utility", () => {
  const originalEnv = process.env;
  let currentSendMailImpl;

  beforeAll(() => {
    nodemailer.createTransport.mockImplementation(() => ({
      sendMail: (...args) => currentSendMailImpl(...args),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    currentSendMailImpl = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should skip sending email and return null if EMAIL_USER or EMAIL_PASS is missing", async () => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = await sendEmail("candidate@gmail.com", "Test Subject", "<p>Test</p>");

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("EMAIL_USER or EMAIL_PASS not set")
    );
    expect(currentSendMailImpl).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("should attempt sending email with correct payload when credentials are set", async () => {
    process.env.EMAIL_USER = "SkillBridge684@gmail.com";
    process.env.EMAIL_PASS = "mock_app_password";

    currentSendMailImpl = jest.fn().mockResolvedValue({ response: "250 2.0.0 OK" });

    const result = await sendEmail("applicant@gmail.com", "Application Received", "<h1>Thank You</h1>");

    expect(result).toEqual({ response: "250 2.0.0 OK" });
    expect(currentSendMailImpl).toHaveBeenCalledWith({
      from: "SkillBridge <SkillBridge684@gmail.com>",
      to: "applicant@gmail.com",
      subject: "Application Received",
      html: "<h1>Thank You</h1>",
    });
  });

  it("should catch connection errors (ENETUNREACH/ECONNECTION) and return null without throwing", async () => {
    process.env.EMAIL_USER = "SkillBridge684@gmail.com";
    process.env.EMAIL_PASS = "mock_app_password";

    const error = new Error("connect ENETUNREACH 2404:6800:4003:c03::6c:587");
    error.code = "ENETUNREACH";
    currentSendMailImpl = jest.fn().mockRejectedValue(error);

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await sendEmail("candidate@gmail.com", "Subject", "<p>Body</p>");

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error sending email:",
      error.message
    );
    consoleErrorSpy.mockRestore();
  });
});
