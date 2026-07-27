const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("express-async-handler");

/* ==========================
   REGISTER USER
========================== */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role,
  });

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/* ==========================
   LOGIN USER
========================== */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "3d" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/* ==========================
   GOOGLE LOGIN
========================== */
const googleLogin = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "candidate",
    });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "3d" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "Google login successful",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

/* ==========================
   UPLOAD RESUME
========================== */
const uploadResume = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { resume: req.file.path },
    { new: true },
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
    res.status(404);
    throw new Error("User not found");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
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

  res.status(200).json({ message: "Password reset email sent" });
});

/* ==========================
   RESET PASSWORD
========================== */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  user.password = await bcrypt.hash(password, 10);
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
