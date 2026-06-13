const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

/* ==========================
   REGISTER USER
========================== */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
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
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   LOGIN USER
========================== */
const loginUser = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { email, password } = req.body;
    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    console.log("USER:", user);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   GOOGLE LOGIN
========================== */
const googleLogin = async (req, res) => {
  try {
    const { name, email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const hashedPassword = await bcrypt.hash("google-auth", 10);
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
      { expiresIn: "7d" }
    );

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
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Google login failed" });
  }
};

/* ==========================
   UPLOAD RESUME
========================== */
const uploadResume = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resume: req.file.path },
      { new: true }
    );

    res.status(200).json({
      message: "Resume uploaded",
      resume: user.resume,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ==========================
   FORGOT PASSWORD
========================== */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   RESET PASSWORD
========================== */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  uploadResume,
  forgotPassword,
  resetPassword,
};