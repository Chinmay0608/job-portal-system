const User = require("../models/user");
const Job = require("../models/job");
const MasterSkill = require("../models/MasterSkill");
const Application = require("../models/Application");
const bcrypt = require("bcryptjs");
const { extractSkillsFromResume, extractSkillsFromBuffer } = require("../services/resumeParserService");
const asyncHandler = require("express-async-handler");
const logger = require("../utils/logger");

// Helper to generate a signed Cloudinary URL for a resume
const generateSignedResumeUrl = (resumeUrl) => {
  const urlParts = resumeUrl.split("/upload/");
  if (urlParts.length !== 2) {
    return resumeUrl; // Fallback for old unauthenticated local paths if any
  }
  const pathWithoutUpload = urlParts[1];
  const versionRegex = /^v\d+\//;
  let publicIdWithExtension = pathWithoutUpload.replace(versionRegex, "");
  
  const cloudinary = require("../config/cloudinary");
  return cloudinary.utils.url(publicIdWithExtension, {
    resource_type: "raw",
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60, // 15 mins
  });
};

const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    location,
    linkedin,
    github,
    about,
    skills,
    education,
    experienceLevel,
    field,
    designation,
    companyName,
    companyWebsite,
  } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = name || user.name;
  user.phone = phone || "";
  user.location = location || "";
  user.linkedin = linkedin || "";
  user.github = github || "";
  user.about = about || "";
  user.education = education || "";
  user.experienceLevel = experienceLevel || "Fresher";
  user.field = field || user.field || "Software Engineering";
  if (skills) {
    try {
      const parsedSkills = JSON.parse(skills);
      // FIX I-11: JSON.parse succeeds on non-array values like "{}" or "null".
      // Validate the result is actually an array to prevent silent data corruption.
      if (!Array.isArray(parsedSkills)) {
        return res.status(400).json({ message: "Invalid skills format — expected a JSON array" });
      }
      user.skills = parsedSkills;
    } catch (error) {
      return res.status(400).json({ message: "Invalid skills format — expected a JSON array" });
    }
  } else {
    user.skills = [];
  }
  user.designation = designation || "";
  user.companyName = companyName || "";
  user.companyWebsite = companyWebsite || "";

  /* Resume */
  if (req.files?.resume?.[0]) {
    user.resume = req.files.resume[0].path;
  }

  /* Profile Image */
  if (req.files?.profileImage?.[0]) {
    user.profileImage = req.files.profileImage[0].path;
  }

  // Resume Parsing Logic for Skill Extraction
  let newlyExtractedSkills = [];
  if (req.files?.resume?.[0]) {
    const resumePath = req.files.resume[0].path;
    newlyExtractedSkills = await extractSkillsFromResume(resumePath, user.skills);
    
    if (newlyExtractedSkills.length > 0) {
      user.skills = [...user.skills, ...newlyExtractedSkills];
    }
  }

  await user.save();

  // FIX I-10: Return a clean DTO instead of the full user document.
  // The raw document exposes internal arrays (hiddenJobs, savedJobs) unnecessarily.
  res.status(200).json({
    message: "Profile updated successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      location: user.location,
      linkedin: user.linkedin,
      github: user.github,
      about: user.about,
      skills: user.skills,
      education: user.education,
      experienceLevel: user.experienceLevel,
      designation: user.designation,
      companyName: user.companyName,
      companyWebsite: user.companyWebsite,
      resume: user.resume,
      profileImage: user.profileImage,
    },
    extractedSkills: newlyExtractedSkills,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    res.status(400);
    throw new Error("All password fields are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400);
    throw new Error("New passwords do not match");
  }

  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
});

const toggleSaveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;

  if (!jobId) {
    res.status(400);
    throw new Error("Job ID is required");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isSaved = user.savedJobs.some(
    (savedJobId) => savedJobId.toString() === jobId,
  );

  if (isSaved) {
    user.savedJobs = user.savedJobs.filter(
      (savedJobId) => savedJobId.toString() !== jobId,
    );
  } else {
    user.savedJobs.push(jobId);
  }

  await user.save();

  res.status(200).json({
    message: isSaved ? "Job removed from saved jobs" : "Job saved successfully",
    saved: !isSaved,
    savedJobs: user.savedJobs,
  });
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: "savedJobs",
    populate: {
      path: "recruiter",
      select: "name email",
    },
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ savedJobs: user.savedJobs || [] });
});

const extractSkills = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || !user.resume) {
    res.status(400);
    throw new Error("No resume found to extract skills from.");
  }

  logger.info("[Resume Parser] Downloading saved resume for extraction...");
  const signedUrl = generateSignedResumeUrl(user.resume);
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch resume from Cloudinary: ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  
  const newlyExtractedSkills = await extractSkillsFromBuffer(arrayBuffer, user.skills);

  if (newlyExtractedSkills.length > 0) {
    user.skills = [...user.skills, ...newlyExtractedSkills];
    await user.save();
  }

  res.status(200).json({
    message:
      newlyExtractedSkills.length > 0
        ? `Successfully extracted ${newlyExtractedSkills.length} new skills!`
        : "No new skills found in your resume.",
    user,
    extractedSkills: newlyExtractedSkills,
  });
});

/* ==========================
   GET SIGNED RESUME URL
========================== */
const getSignedResumeUrl = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Only the candidate themselves or a recruiter can view the resume
  if (req.user.role === "candidate" && req.user.id !== userId) {
    res.status(403);
    throw new Error("Access denied");
  }

  // If recruiter, check they have an application linking them to this candidate
  if (req.user.role === "recruiter") {
    const recruiterJobIds = await Job.find({ recruiter: req.user.id }).select("_id");
    const jobIdList = recruiterJobIds.map((j) => j._id);

    const hasApplied = await Application.exists({
      candidate: userId,
      job: { $in: jobIdList },
    });

    if (!hasApplied) {
      res.status(403);
      throw new Error("Access denied");
    }
  }

  const targetUser = await User.findById(userId);
  if (!targetUser || !targetUser.resume) {
    res.status(404);
    throw new Error("Resume not found");
  }

  const signedUrl = generateSignedResumeUrl(targetUser.resume);
  res.redirect(signedUrl);
});

module.exports = {
  updateProfile,
  changePassword,
  toggleSaveJob,
  getSavedJobs,
  extractSkills,
  getSignedResumeUrl,
};
