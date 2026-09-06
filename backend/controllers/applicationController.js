const Application = require("../models/Application");
const Job = require("../models/job");
const cloudinary = require("../config/cloudinary");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("express-async-handler");

const applyJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  let resumeUrl = "";

  if (req.file && req.file.path) {
    resumeUrl = req.file.path;
  }

  try {
    const application = await Application.create({
      candidate: req.user.id,
      job: jobId,
      resume: resumeUrl,
    });

    res.status(201).json({ message: "Applied successfully", application });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      throw new Error("Already applied to this job");
    }
    throw error;
  }
});

const applyExternal = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  const job = await Job.findById(jobId);
  if (!job || !job.isExternal) {
    res.status(400);
    throw new Error("Invalid external job");
  }

  try {
    const application = await Application.create({
      candidate: req.user.id,
      job: jobId,
      status: "pending",
    });

    res
      .status(201)
      .json({ message: "External application tracked", application });
  } catch (error) {
    if (error.code === 11000) {
      const existingApp = await Application.findOne({ candidate: req.user.id, job: jobId });
      return res.status(200).json({ message: "Already tracked application", application: existingApp });
    }
    throw error;
  }
});

const getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const perPage = Number(limit) > 0 ? Number(limit) : 20;

  const query = { candidate: req.user.id };
  const totalApplications = await Application.countDocuments(query);

  const applications = await Application.find(query)
    .populate({
      path: "job",
      select: "title company location description salary salaryMin salaryMax salaryCurrency isExternal source companyLogo applyUrl",
    })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  const totalPages = Math.ceil(totalApplications / perPage) || 1;

  res.status(200).json({ 
    applications,
    totalApplications,
    totalPages,
    currentPage,
  });
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
  const { page = 1, limit = 20 } = req.query;
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const perPage = Number(limit) > 0 ? Number(limit) : 20;

  const recruiterJobs = await Job.find({ recruiter: req.user.id }).select("_id");
  const jobIds = recruiterJobs.map((job) => job._id);

  if (jobIds.length === 0) {
    return res.status(200).json({ applications: [], totalApplications: 0, totalPages: 1, currentPage: 1 });
  }

  const query = { job: { $in: jobIds } };
  const totalApplications = await Application.countDocuments(query);

  const recruiterApplications = await Application.find(query)
    .populate("candidate", "name email resume")
    .populate("job", "title company recruiter")
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  const totalPages = Math.ceil(totalApplications / perPage) || 1;

  res.status(200).json({ 
    applications: recruiterApplications,
    totalApplications,
    totalPages,
    currentPage,
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'shortlisted', 'rejected', 'applied_externally', 'selected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

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

  // FIX I-15: Removed the OR clause that allowed candidates to update their own status.
  // Only the recruiter who owns the job may change application statuses.
  // (The route already guards with authorizeRoles("recruiter") but the in-controller
  // check was also wrong and dangerous if ever the route guard is relaxed.)
  if (application.job.recruiter.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }

  application.status = status;
  await application.save();

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


const getApplicationsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { status, search } = req.query;

  const filter = {};
  if (status) filter.status = status;

  // Search by candidate name/email or job title/company requires manual joining or regex across populated fields.
  // For simplicity and speed without complex aggregations, we'll do basic application level filtering,
  // and handle populated search in memory if 'search' is provided (since we have pagination, doing it perfectly requires aggregation pipeline).
  // Real-world: use aggregation pipeline with $lookup.
  // Here we'll just implement status filtering directly and basic stats.

  // Summary Stats
  const totalApps = await Application.countDocuments();
  const pendingApps = await Application.countDocuments({ status: "pending" });
  const shortlistedApps = await Application.countDocuments({ status: "shortlisted" });
  const rejectedApps = await Application.countDocuments({ status: "rejected" });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // FIX I-05: Application schema has no 'appliedAt' field — timestamps: true creates 'createdAt'.
  const appsToday = await Application.countDocuments({ createdAt: { $gte: today } });

  const stats = {
    total: totalApps,
    pending: pendingApps,
    shortlisted: shortlistedApps,
    rejected: rejectedApps,
    addedToday: appsToday
  };

  // Get applications
  const skip = (page - 1) * limit;
  let applications = await Application.find(filter)
    .sort({ createdAt: -1 }) // FIX I-06: 'appliedAt' does not exist; use Mongoose timestamp 'createdAt'
    .populate("candidate", "name email resume")
    .populate("job", "title company isExternal applyUrl")
    .skip(skip)
    .limit(limit)
    .lean();

  // Basic in-memory search for the current page (fallback for full-text search)
  if (search) {
    const s = search.toLowerCase();
    applications = applications.filter(app => {
      const cName = app.candidate?.name?.toLowerCase() || "";
      const cEmail = app.candidate?.email?.toLowerCase() || "";
      const jTitle = app.job?.title?.toLowerCase() || "";
      const jComp = app.job?.company?.toLowerCase() || "";
      return cName.includes(s) || cEmail.includes(s) || jTitle.includes(s) || jComp.includes(s);
    });
  }

  const totalFiltered = await Application.countDocuments(filter);
  const totalPages = Math.ceil(totalFiltered / limit) || 1;

  res.status(200).json({
    applications,
    stats,
    page,
    totalPages,
    totalApplications: totalFiltered
  });
});

module.exports = {
  getApplicationsAdmin,
  applyJob,
  applyExternal,
  getMyApplications,
  getRecruiterApplications,
  getRecruiterStats,
  updateApplicationStatus,
  withdrawApplication,
};
