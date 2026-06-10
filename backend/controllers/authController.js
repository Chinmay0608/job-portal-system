const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

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

module.exports = { registerUser, loginUser, uploadResume, googleLogin };