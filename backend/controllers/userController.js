const User = require("../models/user");

/* ==========================
   UPDATE PROFILE
========================== */
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const updateData = { name };

    // only update resume if new file uploaded
    if (req.file) {
      updateData.resume = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

module.exports = {
  updateProfile,
};