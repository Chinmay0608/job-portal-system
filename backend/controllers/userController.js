const User =
  require("../models/user");
const Job = require("../models/job");

const updateProfile =
  async (req, res) => {
    console.log(
      "UPDATE ROUTE HIT"
    );
    try {

      console.log(req.files);
      console.log(req.body);

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

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User not found",
          });
      }

      user.name =
        name || user.name;

      user.phone =
        phone || "";

      user.location =
        location || "";

      user.linkedin =
        linkedin || "";

      user.github =
        github || "";

      user.about =
        about || "";

      user.education =
        education || "";

      user.experienceLevel =
        experienceLevel || "Fresher";

      user.skills =
        skills
          ? JSON.parse(
              skills
            )
          : [];

      user.designation =
        designation || "";

      user.companyName =
        companyName || "";

      user.companyWebsite =
        companyWebsite || "";

      /* Resume */
      if (
        req.files?.resume?.[0]
      ) {
        user.resume =
          req.files
            .resume[0]
            .path;
      }

      /* Profile Image */
      if (
        req.files
          ?.profileImage?.[0]
      ) {
        user.profileImage =
          req.files
            .profileImage[0]
            .path;
      }

      await user.save();

      res.status(200).json({
        message:
          "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        message:
          "Profile update failed",
      });
    }
  };

const toggleSaveJob =
  async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }

      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isSaved = user.savedJobs.some(
        (savedJobId) => savedJobId.toString() === jobId
      );

      if (isSaved) {
        user.savedJobs = user.savedJobs.filter(
          (savedJobId) => savedJobId.toString() !== jobId
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update saved jobs" });
    }
  };

const getSavedJobs =
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate({
          path: "savedJobs",
          populate: {
            path: "recruiter",
            select: "name email",
          },
        });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ savedJobs: user.savedJobs || [] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to load saved jobs" });
    }
  };

module.exports = {
  updateProfile,
  toggleSaveJob,
  getSavedJobs,
};