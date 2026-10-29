const User = require("../models/user");
const Job = require("../models/job");
const MasterSkill = require("../models/MasterSkill");
const Application = require("../models/Application");
const bcrypt = require("bcryptjs");
const { extractSkillsFromResume, extractSkillsFromBuffer, parseFullResumeFromFile, parseFullResumeFromBuffer } = require("../services/resumeParserService");
const asyncHandler = require("express-async-handler");
const logger = require("../utils/logger");
const { PASSWORD_POLICY_MESSAGE, isStrongPassword } = require("../utils/passwordPolicy");

const cleanProfileUrl = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) {
    throw new Error("Enter a valid http or https URL");
  }
  return parsed.toString();
};

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

// Helper to save missing skills into MasterSkill collection in MongoDB
const saveSkillsToMaster = async (skills = []) => {
  if (!Array.isArray(skills) || skills.length === 0) return;
  for (const skill of skills) {
    if (!skill || typeof skill !== "string" || !skill.trim()) continue;
    const cleanSkill = skill.trim();
    try {
      const escaped = cleanSkill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const existing = await MasterSkill.findOne({
        name: { $regex: new RegExp(`^${escaped}$`, "i") },
      });
      if (!existing) {
        await MasterSkill.create({ name: cleanSkill });
        logger.info(`[MasterSkill] Auto-added missing skill to database: ${cleanSkill}`);
      }
    } catch (err) {
      if (err.code !== 11000) {
        logger.warn(`[MasterSkill] Skill insert notice for '${cleanSkill}':`, err.message);
      }
    }
  }
};

const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    location,
    country,
    linkedin,
    github,
    portfolio,
    about,
    skills,
    education,
    experienceLevel,
    field,
    emailNotificationsEnabled,
    emailDigestFrequency,
    designation,
    companyName,
    companyWebsite,
    removeCompanyLogo,
    companyIndustry,
    companySize,
    companyHeadquarters,
    companySocials,
    timeZone,
    schedulingLink,
    emailSignature,
    contactVisibility,
  } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!String(name ?? user.name ?? "").trim()) {
    return res.status(400).json({ message: "Full Name is required" });
  }

  if (!String(user.email ?? "").trim()) {
    return res.status(400).json({ message: "Email Address is required" });
  }

  if (user.role === "candidate" && !String(location ?? user.location ?? "").trim()) {
    return res.status(400).json({ message: "Location is required" });
  }

  if (user.role === "candidate" && !String(country ?? user.country ?? "India").trim()) {
    return res.status(400).json({ message: "Country is required" });
  }

  if (user.role === "candidate" && !String(education ?? user.education ?? "").trim()) {
    return res.status(400).json({ message: "Highest Qualification is required" });
  }

  if (user.role === "candidate" && !String(experienceLevel ?? user.experienceLevel ?? "Fresher").trim()) {
    return res.status(400).json({ message: "Experience Level is required" });
  }

  if (user.role === "recruiter") {
    const requiredRecruiterFields = [
      ["Location", location ?? user.location],
      ["Job title", designation ?? user.designation],
      ["LinkedIn profile", linkedin ?? user.linkedin],
    ];
    const missingField = requiredRecruiterFields.find(([, value]) => !String(value || "").trim());
    if (missingField) return res.status(400).json({ message: `${missingField[0]} is required` });
  }

  user.name = name || user.name;
  user.phone = phone || "";
  user.location = location !== undefined ? location : (user.location || "");
  user.country = country || user.country || "India";
  user.linkedin = linkedin !== undefined ? linkedin : (user.linkedin || "");
  user.github = github !== undefined ? github : (user.github || "");
  user.portfolio = portfolio !== undefined ? portfolio : (user.portfolio || "");
  user.about = about !== undefined ? about : (user.about || "");
  user.education = education !== undefined ? education : (user.education || "");
  user.experienceLevel = experienceLevel || user.experienceLevel || "Fresher";
  user.field = field || user.field || "Software Engineering";
  if (emailNotificationsEnabled !== undefined) {
    user.emailNotificationsEnabled = emailNotificationsEnabled === true || emailNotificationsEnabled === "true";
  }
  if (emailDigestFrequency !== undefined) {
    const normalizedFreq = String(emailDigestFrequency).trim().toLowerCase();
    if (["daily", "weekly", "monthly"].includes(normalizedFreq)) {
      user.emailDigestFrequency = normalizedFreq;
    }
  }
  if (skills !== undefined && skills !== null && skills !== "") {
    try {
      const parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills;
      if (!Array.isArray(parsedSkills)) {
        return res.status(400).json({ message: "Invalid skills format — expected a JSON array" });
      }
      user.skills = parsedSkills;
      // Auto-save user skills to MasterSkill collection
      await saveSkillsToMaster(parsedSkills);
    } catch (error) {
      return res.status(400).json({ message: "Invalid skills format — expected a JSON array" });
    }
  } else {
    // Preserve existing skills if not specified in request
    user.skills = user.skills || [];
  }
  user.designation = designation !== undefined ? designation : (user.designation || "");
  user.companyName = companyName !== undefined ? companyName : (user.companyName || "");
  user.companyWebsite = companyWebsite !== undefined ? companyWebsite : (user.companyWebsite || "");
  user.companyIndustry = companyIndustry !== undefined ? companyIndustry : (user.companyIndustry || "");
  user.companySize = companySize !== undefined ? companySize : (user.companySize || "");
  user.companyHeadquarters = companyHeadquarters !== undefined ? companyHeadquarters : (user.companyHeadquarters || "");
  user.timeZone = timeZone !== undefined ? String(timeZone).trim() || "Asia/Kolkata" : (user.timeZone || "Asia/Kolkata");
  user.emailSignature = emailSignature !== undefined ? String(emailSignature).slice(0, 1000) : (user.emailSignature || "");
  if (schedulingLink !== undefined) user.schedulingLink = cleanProfileUrl(schedulingLink);
  if (companyWebsite !== undefined) user.companyWebsite = cleanProfileUrl(companyWebsite);
  if (linkedin !== undefined) user.linkedin = cleanProfileUrl(linkedin);
  if (contactVisibility !== undefined) user.contactVisibility = contactVisibility === true || contactVisibility === "true";
  if (removeCompanyLogo === true || removeCompanyLogo === "true") user.companyLogo = "";
  if (user.role === "recruiter" && String(user.companyName || "").trim() && String(user.companyWebsite || "").trim() && String(user.designation || "").trim()) {
    user.isOnboarded = true;
    user.recruiterOnboardingPromptDismissed = true;
  }

  if (companySocials !== undefined) {
    let socials;
    try {
      socials = typeof companySocials === "string" ? JSON.parse(companySocials) : companySocials;
    } catch {
      return res.status(400).json({ message: "Company socials must be valid JSON" });
    }
    if (!socials || typeof socials !== "object" || Array.isArray(socials)) {
      return res.status(400).json({ message: "Company socials must be an object" });
    }
    try {
      user.companySocials = {
        linkedin: cleanProfileUrl(socials.linkedin),
        twitter: cleanProfileUrl(socials.twitter),
        github: cleanProfileUrl(socials.github),
      };
    } catch {
      return res.status(400).json({ message: "Company social links must be valid http or https URLs" });
    }
  }

  /* Resume */
  if (req.files?.resume?.[0]) {
    user.resume = req.files.resume[0].path;
  }

  /* Profile Image */
  if (req.files?.profileImage?.[0]) {
    user.profileImage = req.files.profileImage[0].path;
  }

  if (req.files?.companyLogo?.[0]) {
    user.companyLogo = req.files.companyLogo[0].path;
  }

  // Resume Parsing & Auto-filling Logic for Blank Profile Fields
  let newlyExtractedSkills = [];
  let newlyFilledFields = [];
  if (req.files?.resume?.[0]) {
    const resumePath = req.files.resume[0].path;
    const fullData = await parseFullResumeFromFile(resumePath, user);

    if ((!user.name || !user.name.trim()) && fullData.name) {
      user.name = fullData.name;
      newlyFilledFields.push("Name");
    }
    if ((!user.phone || !user.phone.trim()) && fullData.phone) {
      user.phone = fullData.phone;
      newlyFilledFields.push("Phone");
    }
    if ((!user.location || !user.location.trim()) && fullData.location) {
      user.location = fullData.location;
      newlyFilledFields.push("Location");
    }
    if ((!user.linkedin || !user.linkedin.trim()) && fullData.linkedin) {
      user.linkedin = fullData.linkedin;
      newlyFilledFields.push("LinkedIn");
    }
    if ((!user.github || !user.github.trim()) && fullData.github) {
      user.github = fullData.github;
      newlyFilledFields.push("GitHub");
    }
    if ((!user.portfolio || !user.portfolio.trim()) && fullData.portfolio) {
      user.portfolio = fullData.portfolio;
      newlyFilledFields.push("Portfolio");
    }
    if ((!user.about || !user.about.trim()) && fullData.about) {
      user.about = fullData.about;
      newlyFilledFields.push("About");
    }
    if ((!user.education || !user.education.trim()) && fullData.education) {
      user.education = fullData.education;
      newlyFilledFields.push("Education");
    }
    if ((!user.experienceLevel || user.experienceLevel === "Fresher") && fullData.experienceLevel) {
      user.experienceLevel = fullData.experienceLevel;
      newlyFilledFields.push("Experience Level");
    }
    if ((!user.field || user.field === "Software Engineering") && fullData.field) {
      user.field = fullData.field;
      newlyFilledFields.push("Field");
    }

    if (fullData.skills && fullData.skills.length > 0) {
      // Auto-add newly extracted skills to MasterSkill collection
      await saveSkillsToMaster(fullData.skills);

      const existingLower = new Set((user.skills || []).map((s) => s.toLowerCase()));
      const newSkills = fullData.skills.filter((s) => s && !existingLower.has(s.toLowerCase()));
      if (newSkills.length > 0) {
        user.skills = [...(user.skills || []), ...newSkills];
        newlyExtractedSkills = newSkills;
        newlyFilledFields.push(`${newSkills.length} new skills`);
      }
    }
  }

  await user.save();

  const successMessage = newlyFilledFields.length > 0
    ? `Profile updated & magically filled out: ${newlyFilledFields.join(", ")}!`
    : "Profile updated successfully";

  // FIX I-10: Return a clean DTO instead of the full user document.
  // The raw document exposes internal arrays (hiddenJobs, savedJobs) unnecessarily.
  res.status(200).json({
    message: successMessage,
    extractedSkills: newlyExtractedSkills,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      location: user.location,
      country: user.country || "India",
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      about: user.about,
      skills: user.skills,
      education: user.education,
      highestQualification: user.highestQualification || user.education || "",
      hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
      isOnboarded: user.isOnboarded ?? false,
      recruiterOnboardingPromptDismissed: user.recruiterOnboardingPromptDismissed ?? false,
      experienceLevel: user.experienceLevel,
      field: user.field || "Software Engineering",
      emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
      designation: user.designation,
      companyName: user.companyName,
      companyWebsite: user.companyWebsite,
      companyLogo: user.companyLogo || "",
      companyIndustry: user.companyIndustry || "",
      companySize: user.companySize || "",
      companyHeadquarters: user.companyHeadquarters || "",
      companySocials: user.companySocials || { linkedin: "", twitter: "", github: "" },
      timeZone: user.timeZone || "Asia/Kolkata",
      schedulingLink: user.schedulingLink || "",
      emailSignature: user.emailSignature || "",
      contactVisibility: user.contactVisibility ?? false,
      isVerified: user.isVerified ?? false,
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

  if (!isStrongPassword(newPassword)) {
    res.status(400);
    throw new Error(PASSWORD_POLICY_MESSAGE);
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
  
  const fullData = await parseFullResumeFromBuffer(arrayBuffer);
  let newlyFilledFields = [];
  let newlyExtractedSkills = [];

  if ((!user.name || !user.name.trim()) && fullData.name) {
    user.name = fullData.name;
    newlyFilledFields.push("Name");
  }
  if ((!user.phone || !user.phone.trim()) && fullData.phone) {
    user.phone = fullData.phone;
    newlyFilledFields.push("Phone");
  }
  if ((!user.location || !user.location.trim()) && fullData.location) {
    user.location = fullData.location;
    newlyFilledFields.push("Location");
  }
  if ((!user.linkedin || !user.linkedin.trim()) && fullData.linkedin) {
    user.linkedin = fullData.linkedin;
    newlyFilledFields.push("LinkedIn");
  }
  if ((!user.github || !user.github.trim()) && fullData.github) {
    user.github = fullData.github;
    newlyFilledFields.push("GitHub");
  }
  if ((!user.portfolio || !user.portfolio.trim()) && fullData.portfolio) {
    user.portfolio = fullData.portfolio;
    newlyFilledFields.push("Portfolio");
  }
  if ((!user.about || !user.about.trim()) && fullData.about) {
    user.about = fullData.about;
    newlyFilledFields.push("About");
  }
  if ((!user.education || !user.education.trim()) && fullData.education) {
    user.education = fullData.education;
    newlyFilledFields.push("Education");
  }
  if ((!user.experienceLevel || user.experienceLevel === "Fresher") && fullData.experienceLevel) {
    user.experienceLevel = fullData.experienceLevel;
    newlyFilledFields.push("Experience Level");
  }
  if ((!user.field || user.field === "Software Engineering") && fullData.field) {
    user.field = fullData.field;
    newlyFilledFields.push("Field");
  }

  if (fullData.skills && fullData.skills.length > 0) {
    // Extract from Resume replaces stale parser-generated and generic tags.
    await saveSkillsToMaster(fullData.skills);
    user.skills = fullData.skills;
    newlyExtractedSkills = fullData.skills;
    newlyFilledFields.push(`${fullData.skills.length} resume skills`);
  }

  await user.save();

  const successMessage = newlyFilledFields.length > 0
    ? `Magically extracted & pre-filled: ${newlyFilledFields.join(", ")}!`
    : "No new profile details found in your resume.";

  res.status(200).json({
    message: successMessage,
    user,
    extractedSkills: newlyExtractedSkills,
  });
});

const clearSkills = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.skills = [];
  await user.save();
  res.status(200).json({ skills: user.skills });
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
  if (req.query.format === "json" || req.headers.accept?.includes("application/json")) {
    return res.status(200).json({ signedUrl });
  }
  res.redirect(signedUrl);
});

/* ==========================
   GET USER PROFILE
========================== */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const userApps = await Application.find({ candidate: user._id }).populate("job", "_id");
  const orphanedIds = userApps.filter((app) => !app.job).map((app) => app._id);
  if (orphanedIds.length > 0) {
    await Application.deleteMany({ _id: { $in: orphanedIds } });
  }
  const applicationsCount = userApps.length - orphanedIds.length;

  res.status(200).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      location: user.location || "",
      country: user.country || "India",
      linkedin: user.linkedin || "",
      github: user.github || "",
      portfolio: user.portfolio || "",
      about: user.about || "",
      skills: user.skills || [],
      education: user.education || "",
      highestQualification: user.highestQualification || user.education || "",
      hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
      isOnboarded: user.isOnboarded ?? false,
      recruiterOnboardingPromptDismissed: user.recruiterOnboardingPromptDismissed ?? false,
      experienceLevel: user.experienceLevel || "Fresher",
      field: user.field || "Software Engineering",
      emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
      designation: user.designation || "",
      companyName: user.companyName || "",
      companyWebsite: user.companyWebsite || "",
      companyLogo: user.companyLogo || "",
      companyIndustry: user.companyIndustry || "",
      companySize: user.companySize || "",
      companyHeadquarters: user.companyHeadquarters || "",
      companySocials: user.companySocials || { linkedin: "", twitter: "", github: "" },
      timeZone: user.timeZone || "Asia/Kolkata",
      schedulingLink: user.schedulingLink || "",
      emailSignature: user.emailSignature || "",
      contactVisibility: user.contactVisibility ?? false,
      isVerified: user.isVerified ?? false,
      resume: user.resume || "",
      profileImage: user.profileImage || "",
      savedJobs: user.savedJobs || [],
      applicationsCount,
      savedJobsCount: user.savedJobs?.length || 0,
    },
  });
});

const completeRecruiterOnboarding = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "recruiter") return res.status(403).json({ message: "Recruiter account required" });

  const timeZone = String(req.body.timeZone || "").trim();
  if (timeZone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone }).format();
      user.timeZone = timeZone;
    } catch {
      // Ignore an unavailable browser time zone and retain the account default.
    }
  }

  if (req.body.skip === "true" || req.body.skip === true) {
    user.recruiterOnboardingPromptDismissed = true;
    await user.save();
    return res.status(200).json({
      message: "Onboarding reminder saved",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName || "",
        companyWebsite: user.companyWebsite || "",
        companyLogo: user.companyLogo || "",
        designation: user.designation || "",
        timeZone: user.timeZone || "Asia/Kolkata",
        isOnboarded: user.isOnboarded ?? false,
        recruiterOnboardingPromptDismissed: true,
      },
    });
  }

  const companyName = String(req.body.companyName || "").trim();
  const designation = String(req.body.designation || "").trim();
  if (!companyName) return res.status(400).json({ message: "Company name is required" });
  if (!designation) return res.status(400).json({ message: "Recruiter designation is required" });

  let companyWebsite;
  try {
    companyWebsite = cleanProfileUrl(req.body.companyWebsite);
  } catch {
    return res.status(400).json({ message: "Enter a valid company website URL" });
  }
  if (!companyWebsite) return res.status(400).json({ message: "Company website is required" });

  user.companyName = companyName;
  user.companyWebsite = companyWebsite;
  user.designation = designation;
  if (req.files?.companyLogo?.[0]) user.companyLogo = req.files.companyLogo[0].path;
  user.isOnboarded = true;
  user.recruiterOnboardingPromptDismissed = true;
  await user.save();

  return res.status(200).json({
    message: "Recruiter onboarding complete",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyName: user.companyName,
      companyWebsite: user.companyWebsite,
      companyLogo: user.companyLogo || "",
      designation: user.designation,
      timeZone: user.timeZone || "Asia/Kolkata",
      isOnboarded: true,
      recruiterOnboardingPromptDismissed: true,
    },
  });
});

/* ==========================
   COMPLETE ONBOARDING
========================== */
const completeOnboarding = asyncHandler(async (req, res) => {
  const { location, country, highestQualification, experienceLevel, skills } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (location !== undefined && !String(location).trim()) {
    return res.status(400).json({ message: "Location is required" });
  }
  if (location !== undefined) user.location = String(location).trim();
  if (country !== undefined) user.country = String(country).trim() || "India";
  if (highestQualification !== undefined) {
    const trimmedHQ = String(highestQualification).trim();
    user.highestQualification = trimmedHQ;
    user.education = trimmedHQ;
  }
  if (experienceLevel !== undefined) user.experienceLevel = experienceLevel;
  if (req.body.field !== undefined) user.field = String(req.body.field).trim();
  if (Array.isArray(req.body.targetSeniority)) {
    user.targetSeniority = req.body.targetSeniority.map((s) => String(s).trim()).filter(Boolean);
  }
  if (Array.isArray(skills)) {
    const cleanSkills = skills.map((s) => String(s).trim()).filter(Boolean);
    user.skills = cleanSkills;
    await saveSkillsToMaster(cleanSkills);
  }

  user.hasCompletedOnboarding = true;
  await user.save();

  const userApps = await Application.find({ candidate: user._id }).populate("job", "_id");
  const orphanedIds = userApps.filter((app) => !app.job).map((app) => app._id);
  if (orphanedIds.length > 0) {
    await Application.deleteMany({ _id: { $in: orphanedIds } });
  }
  const applicationsCount = userApps.length - orphanedIds.length;

  res.status(200).json({
    message: "Onboarding complete",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      location: user.location || "",
      country: user.country || "India",
      linkedin: user.linkedin || "",
      github: user.github || "",
      portfolio: user.portfolio || "",
      about: user.about || "",
      skills: user.skills || [],
      education: user.education || "",
      highestQualification: user.highestQualification || user.education || "",
      experienceLevel: user.experienceLevel || "Fresher",
      field: user.field || "Software Engineering",
      designation: user.designation || "",
      companyName: user.companyName || "",
      companyWebsite: user.companyWebsite || "",
      resume: user.resume || "",
      profileImage: user.profileImage || "",
      savedJobs: user.savedJobs || [],
      applicationsCount,
      savedJobsCount: user.savedJobs?.length || 0,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  toggleSaveJob,
  getSavedJobs,
  extractSkills,
  clearSkills,
  getSignedResumeUrl,
  completeOnboarding,
  completeRecruiterOnboarding,
};
