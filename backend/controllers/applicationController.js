const Application = require("../models/Application");
const Job = require("../models/job");
const cloudinary = require("../config/cloudinary");
const sendEmail = require("../utils/sendEmail");

const applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    const alreadyApplied = await Application.findOne({
      candidate: req.user.id,
      job: jobId,
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    let resumeUrl = "";

    if (req.file && req.file.buffer) {
      const uploadedFile = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "skillbridge_resumes", resource_type: "raw" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });

      resumeUrl = uploadedFile.secure_url;
    }

    const application = await Application.create({
      candidate: req.user.id,
      job: jobId,
      resume: resumeUrl,
    });

    res.status(201).json({ message: "Applied successfully", application });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate({
        path: "job",
        select: "title company location description salary",
      });

    res.status(200).json({ applications });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await application.deleteOne();

    res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

const getRecruiterApplications = async (req, res) => {
  try {
    const recruiterJobs = await Job.find({ recruiter: req.user.id }).select("_id");
    const jobIds = recruiterJobs.map((job) => job._id);

    if (jobIds.length === 0) {
      return res.status(200).json({ applications: [] });
    }

    const recruiterApplications = await Application.find({ job: { $in: jobIds } })
      .populate("candidate", "name email resume")
      .populate("job", "title company recruiter");

    res.status(200).json({ applications: recruiterApplications });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await Application.findById(applicationId)
      .populate({ path: "job", select: "recruiter title company" })
      .populate({ path: "candidate", select: "name email" });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (!application.job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (application.job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    application.status = status;
    await application.save({ validateBeforeSave: false });

    const emailSubject = "Application Status Update";
    const emailHtml = status === "shortlisted" 
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

    res.status(200).json({ message: "Application status updated successfully", application });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

const getRecruiterStats = async (req, res) => {
  try {
    const recruiterJobs = await Job.find({ recruiter: req.user.id }).select("_id");
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
      { pending: 0, shortlisted: 0, rejected: 0 }
    );

    res.status(200).json({
      totalApplications: counts.pending + counts.shortlisted + counts.rejected,
      shortlisted: counts.shortlisted,
      rejected: counts.rejected,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

module.exports = {
  applyJob,
  getMyApplications,
  getRecruiterApplications,
  getRecruiterStats,
  updateApplicationStatus,
  withdrawApplication,
};