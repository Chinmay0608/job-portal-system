const Application = require("../models/Application");
const Job = require("../models/job");
const cloudinary = require("../config/cloudinary");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("express-async-handler");

const applyJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  const alreadyApplied = await Application.findOne({
    candidate: req.user.id,
    job: jobId,
  });

  if (alreadyApplied) {
    res.status(400);
    throw new Error("Already applied to this job");
  }

  let resumeUrl = "";

  if (req.file && req.file.path) {
    resumeUrl = req.file.path;
  }

  const application = await Application.create({
    candidate: req.user.id,
    job: jobId,
    resume: resumeUrl,
  });

  res.status(201).json({ message: "Applied successfully", application });
});

const applyExternal = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  const job = await Job.findById(jobId);
  if (!job || !job.isExternal) {
    res.status(400);
    throw new Error("Invalid external job");
  }

  const alreadyApplied = await Application.findOne({
    candidate: req.user.id,
    job: jobId,
  });

  if (alreadyApplied) {
    res.status(400);
    throw new Error("Already tracked application");
  }

  const application = await Application.create({
    candidate: req.user.id,
    job: jobId,
    status: "pending",
  });

  res
    .status(201)
    .json({ message: "External application tracked", application });
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({
    candidate: req.user.id,
  }).populate({
    path: "job",
    select: "title company location description salary",
  });

  res.status(200).json({ applications });
});

const withdrawApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const application = await Application.findById(applicationId);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  if (application.candidate.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }

  await application.deleteOne();

  res.status(200).json({ message: "Application withdrawn successfully" });
});

const getRecruiterApplications = asyncHandler(async (req, res) => {
  const recruiterJobs = await Job.find({ recruiter: req.user.id }).select(
    "_id",
  );
  const jobIds = recruiterJobs.map((job) => job._id);

  if (jobIds.length === 0) {
    return res.status(200).json({ applications: [] });
  }

  const recruiterApplications = await Application.find({ job: { $in: jobIds } })
    .populate("candidate", "name email resume")
    .populate("job", "title company recruiter");

  res.status(200).json({ applications: recruiterApplications });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const application = await Application.findById(applicationId)
    .populate({ path: "job", select: "recruiter title company" })
    .populate({ path: "candidate", select: "name email" });

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  if (!application.job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (application.job.recruiter.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }

  application.status = status;
  await application.save({ validateBeforeSave: false });

  const emailSubject = "Application Status Update";
  const emailHtml =
    status === "shortlisted"
      ? `
      <h2>Congratulations 🎉</h2>
      <p>Hello ${application.candidate.name},</p>
      <p>You have been <strong>shortlisted</strong> for the role of <strong>${application.job.title}</strong> at <strong>${application.job.company}</strong>.</p>
      <p>Please stay tuned for further updates.</p>
      <br />
      <p>Team SkillBridge</p>
    `
      : `
      <h2>Application Update</h2>
      <p>Hello ${application.candidate.name},</p>
      <p>Thank you for applying for <strong>${application.job.title}</strong> at <strong>${application.job.company}</strong>.</p>
      <p>We regret to inform you that your application was not selected this time.</p>
      <p>Keep applying — great opportunities are ahead.</p>
      <br />
      <p>Team SkillBridge</p>
    `;

  await sendEmail(application.candidate.email, emailSubject, emailHtml);

  res
    .status(200)
    .json({ message: "Application status updated successfully", application });
});

const getRecruiterStats = asyncHandler(async (req, res) => {
  const recruiterJobs = await Job.find({ recruiter: req.user.id }).select(
    "_id",
  );
  const jobIds = recruiterJobs.map((job) => job._id);

  if (jobIds.length === 0) {
    return res.status(200).json({
      totalApplications: 0,
      shortlisted: 0,
      rejected: 0,
    });
  }

  const stats = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = stats.reduce(
    (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
    { pending: 0, shortlisted: 0, rejected: 0 },
  );

  res.status(200).json({
    totalApplications: counts.pending + counts.shortlisted + counts.rejected,
    shortlisted: counts.shortlisted,
    rejected: counts.rejected,
  });
});

module.exports = {
  applyJob,
  applyExternal,
  getMyApplications,
  getRecruiterApplications,
  getRecruiterStats,
  updateApplicationStatus,
  withdrawApplication,
};
