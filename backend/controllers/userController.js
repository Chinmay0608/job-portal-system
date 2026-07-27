const User = require("../models/user");
const Job = require("../models/job");
const MasterSkill = require("../models/MasterSkill");
const bcrypt = require("bcryptjs");
const { extractSkillsFromResume, extractSkillsFromBuffer } = require("../services/resumeParserService");
const asyncHandler = require("express-async-handler");
const logger = require("../utils/logger");

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
  user.skills = skills ? JSON.parse(skills) : [];
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

  res.status(200).json({
    message: "Profile updated successfully",
    user,
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
  const response = await fetch(user.resume);
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

  const targetUser = await User.findById(userId);
  if (!targetUser || !targetUser.resume) {
    res.status(404);
    throw new Error("Resume not found");
  }

  // The resume is stored as a full Cloudinary URL.
  // We need to extract the public ID.
  // Example: https://res.cloudinary.com/dxyz/raw/authenticated/upload/v1234/skillbridge/resumes/filename.pdf
  // The public ID is everything after the "upload/v[0-9]+/" part.
  const urlParts = targetUser.resume.split("/upload/");
  if (urlParts.length !== 2) {
    return res.redirect(targetUser.resume); // Fallback for old unauthenticated local paths if any
  }

  // Remove the version string (e.g., v1613243/)
  const pathWithoutUpload = urlParts[1];
  const versionRegex = /^v\d+\//;
  let publicIdWithExtension = pathWithoutUpload.replace(versionRegex, "");

  // Cloudinary raw resources typically require the extension in the public ID, 
  // but let's just generate the signed URL using the cloudinary utils.
  const cloudinary = require("../config/cloudinary");
  
  const signedUrl = cloudinary.utils.url(publicIdWithExtension, {
    resource_type: "raw",
    type: "authenticated",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60, // 15 mins
  });

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
