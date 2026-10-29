const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { admin, initializeFirebase } = require("../config/firebase");

initializeFirebase();
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("express-async-handler");
const { PASSWORD_POLICY_MESSAGE, isStrongPassword } = require("../utils/passwordPolicy");
const Application = require("../models/Application");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "5d";
const COOKIE_MAX_AGE = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

const formatUserDTO = (user, applicationsCount = 0) => ({
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
});

/* ==========================
   REGISTER USER
========================== */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const accountRole = role === "recruiter" ? "recruiter" : "candidate";

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(400);
    throw new Error("Registration failed. Email may already be in use.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: accountRole,
  });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
  });

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: formatUserDTO(user),
  });
});

/* ==========================
   LOGIN USER
========================== */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role: requestedRole } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  if (["candidate", "recruiter"].includes(requestedRole) && ["candidate", "recruiter"].includes(user.role) && user.role !== requestedRole) {
    res.status(403);
    throw new Error(`This account is registered as a ${user.role}. Select ${user.role} to sign in.`);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
  });

  const applicationsCount = await Application.countDocuments({ candidate: user._id });

  res.status(200).json({
    message: "Login successful",
    token,
    user: formatUserDTO(user, applicationsCount),
  });
});

const { getAuth } = require("firebase-admin/auth");

/* ==========================
   GOOGLE LOGIN
========================== */
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const requestedRole = ["candidate", "recruiter"].includes(req.body.role)
    ? req.body.role
    : "candidate";
  
  if (!idToken) {
    res.status(400);
    throw new Error("Missing Google ID Token");
  }

  let decodedToken;

  if (!admin.getApps().length && process.env.NODE_ENV === "production") {
    console.error("[AUTH] Google authentication misconfigured in production: Firebase Admin not initialized.");
    res.status(500);
    throw new Error("Google authentication is misconfigured. Please contact support.");
  }

  try {
    if (!admin.getApps().length) {
      console.warn("Firebase Admin not initialized, skipping token verification (DEV ONLY — this must never happen in production)");
      decodedToken = { email: req.body.email, name: req.body.name };
    } else {
      decodedToken = await getAuth().verifyIdToken(idToken);
    }
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired Google token");
  }

  const email = decodedToken.email;
  const name = decodedToken.name || "Google User";
  
  if (!email) {
    res.status(400);
    throw new Error("Email not provided by Google");
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: requestedRole,
    });
  } else if (user.role !== "admin" && user.role !== requestedRole) {
    user.role = requestedRole;
    await user.save();
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
  });

  res.status(200).json({
    message: "Google login successful",
    token,
    user: formatUserDTO(user),
  });
});

/* ==========================
   UPLOAD RESUME
========================== */
const uploadResume = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { resume: req.file.path },
    { returnDocument: "after" },
  );

  res.status(200).json({
    message: "Resume uploaded",
    resume: user.resume,
  });
});

/* ==========================
   FORGOT PASSWORD
========================== */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    // Send generic response to prevent user enumeration
    return res.status(200).json({ message: "If this email is registered, you'll receive a reset link" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(resetToken).digest("hex");
  
  user.resetPasswordToken = hash;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = `
    <h2>Password Reset</h2>
    <p>Click below to reset password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>Link expires in 15 minutes.</p>
  `;

  await sendEmail(user.email, "Reset Password", html);

  res.status(200).json({ message: "If this email is registered, you'll receive a reset link" });
});

/* ==========================
   RESET PASSWORD
========================== */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!isStrongPassword(password)) {
    res.status(400);
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  // TODO: Session invalidation - Neither changePassword nor resetPassword invalidate previously-issued JWTs.
  // Proper fix would need a tokenVersion field on the User model plus a check in authMiddleware.protect
  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
});

/* ==========================
   LOGOUT USER
========================== */
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  uploadResume,
  forgotPassword,
  resetPassword,
  logoutUser,
};
