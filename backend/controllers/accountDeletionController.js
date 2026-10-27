const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const AccountDeletionRequest = require("../models/AccountDeletionRequest");
const Application = require("../models/Application");
const Job = require("../models/job");
const { logSecurityEvent } = require("../middleware/securityAuditMiddleware");
const sendEmail = require("../utils/sendEmail");

const requestOtp = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const { password, reason, privacyRequest = "" } = req.body;
  if (!email || !password || !String(reason || "").trim()) return res.status(400).json({ message: "Email, password, and reason are required." });
  if (String(reason).length > 1000 || String(privacyRequest).length > 1000) return res.status(400).json({ message: "Please keep each response under 1000 characters." });
  const user = await User.findById(req.user.id).select("+password");
  if (!user || user.email !== email || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: "Email or password is incorrect." });
  if (user.role === "admin") return res.status(403).json({ message: "Admin accounts cannot use self-service deletion." });
  const pending = await AccountDeletionRequest.findOne({ user: user._id, status: "pending" });
  const otp = String(crypto.randomInt(100000, 1000000));
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const isNew = !pending;
  const request = pending || new AccountDeletionRequest({ user: user._id, email, reason: String(reason).trim(), privacyRequest: String(privacyRequest).trim() });
  request.reason = String(reason).trim();
  request.privacyRequest = String(privacyRequest).trim();
  request.otpHash = otpHash;
  request.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await request.save();
  const sent = await sendEmail(email, "Verify your account deletion request", `<p>Your SkillBridge account deletion verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`);
  if (!sent) { if (isNew) await AccountDeletionRequest.deleteOne({ _id: request._id }); return res.status(503).json({ message: "Could not send verification email. Please try again later." }); }
  res.json({ message: "Verification code sent to your email." });
};

const confirmOtp = async (req, res) => {
  const request = await AccountDeletionRequest.findOne({ user: req.user.id, status: "pending" }).select("+otpHash");
  const otpHash = crypto.createHash("sha256").update(String(req.body.otp || "")).digest("hex");
  if (!request || !request.otpHash || request.otpExpires < new Date() || !crypto.timingSafeEqual(Buffer.from(otpHash), Buffer.from(request.otpHash))) return res.status(400).json({ message: "Invalid or expired verification code." });
  request.otpHash = undefined;
  request.otpExpires = undefined;
  await request.save();
  res.json({ message: "Request verified. An administrator will review it within 24–48 hours." });
};

const listRequests = async (req, res) => res.json(await AccountDeletionRequest.find({ status: "pending", otpHash: { $exists: false } }).sort({ createdAt: 1 }).populate("user", "name role"));

const decideRequest = async (req, res) => {
  const { decision } = req.body;
  if (!["approved", "rejected"].includes(decision)) return res.status(400).json({ message: "Decision must be approved or rejected." });
  const request = await AccountDeletionRequest.findOneAndUpdate({ _id: req.params.id, status: "pending", otpHash: { $exists: false } }, { status: decision }, { new: true });
  if (!request) return res.status(404).json({ message: "Verified pending request not found." });
  const user = await User.findById(request.user);
  if (decision === "approved" && user) {
    await Application.deleteMany({ candidate: user._id });
    if (user.role === "recruiter") {
      const jobs = await Job.find({ recruiter: user._id }).select("_id");
      await Application.deleteMany({ job: { $in: jobs.map(job => job._id) } });
      await Job.deleteMany({ recruiter: user._id });
    }
    await User.deleteOne({ _id: user._id });
    logSecurityEvent("USER_DELETED", "HIGH", req, { targetEmail: user.email, targetRole: user.role, source: "account_deletion_request" });
  }
  await sendEmail(request.email, `Account deletion request ${decision}`, decision === "approved" ? "<p>Your account deletion request was approved and your account has been deleted.</p>" : "<p>Your account deletion request was not approved. Contact support if you have questions.</p>");
  res.json({ message: `Request ${decision}.`, request });
};

module.exports = { requestOtp, confirmOtp, listRequests, decideRequest };
