const jwt = require("jsonwebtoken");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto =
  require(
    "crypto"
  );

const sendEmail =
  require(
    "../utils/sendEmail"
  );

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalizedEmail, password: hashedPassword, role });

    res.status(201).json({ message: "User registered successfully", user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "Login successful", token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

const googleLogin = async (req, res) => {
  try {
    const { name, email } = req.body;
    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) user = await User.create({ name, email: normalizedEmail, password: await bcrypt.hash("google-auth", 10), role: "candidate" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "Google login successful", token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { console.log(error); res.status(500).json({ message: "Google login failed" }); }
};

const uploadResume = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { resume: req.file.path }, { returnDocument: "after" });
    res.status(200).json({ message: "Resume uploaded", resume: user.resume });
  } catch (error) { console.log(error); res.status(500).json({ message: "Upload failed" }); }
};

const forgotPassword =
  async (req, res) => {

    try {

      const {
        email
      } = req.body;

      const user =
        await User.findOne({
          email:
            email.toLowerCase(),
        });

      if (!user) {
        return res.status(404)
          .json({
            message:
              "User not found",
          });
      }

      const resetToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      user
        .resetPasswordToken =
          resetToken;

      user
        .resetPasswordExpire =
          Date.now() +
          15 * 60 * 1000;

      await user.save();

      const resetUrl =
        `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      const html =
        `
        <h2>Password Reset</h2>

        <p>
          Click below to reset password:
        </p>

        <a href="${resetUrl}">
          Reset Password
        </a>

        <p>
          Link expires in
          15 minutes.
        </p>
        `;

      await sendEmail(
        user.email,
        "Reset Password",
        html
      );

      res.status(200)
        .json({
          message:
            "Password reset email sent",
        });

    } catch (error) {

      console.log(
        error
      );

      res.status(500)
        .json({
          message:
            "Server Error",
        });
    }
  };

  const resetPassword =
  async (req, res) => {

    try {

      const {
        token
      } = req.params;

      const {
        password
      } = req.body;

      const user =
        await User.findOne({

          resetPasswordToken:
            token,

          resetPasswordExpire: {
            $gt:
              Date.now(),
          },
        });

      if (!user) {
        return res.status(400)
          .json({
            message:
              "Invalid or expired token",
          });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      user.password =
        hashedPassword;

      user.resetPasswordToken =
        undefined;

      user.resetPasswordExpire =
        undefined;

      await user.save();

      res.status(200)
        .json({
          message:
            "Password reset successful",
        });

    } catch (error) {

      console.log(
        error
      );

      res.status(500)
        .json({
          message:
            "Server Error",
        });
    }
  };

module.exports = {
  registerUser,
  loginUser,
  uploadResume,
  googleLogin,
  forgotPassword,
  resetPassword,
};