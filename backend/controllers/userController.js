const User =
  require("../models/user");
const Job = require("../models/job");
const MasterSkill = require("../models/MasterSkill");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");

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

      // Resume Parsing Logic for Skill Extraction
      let newlyExtractedSkills = [];
      if (req.files?.resume?.[0]) {
        try {
          const resumePath = req.files.resume[0].path;
          
          // Only attempt parse if it's a PDF
          if (resumePath.toLowerCase().endsWith(".pdf")) {
            console.log("[Resume Parser] Parsing PDF for skills...");
              const fileBuffer = fs.readFileSync(resumePath);
              const uint8Array = new Uint8Array(fileBuffer);
              const parser = new PDFParse(uint8Array);
              const data = await parser.getText();
              const resumeText = data.text.toLowerCase();

            // Fetch all master skills
            const allMasterSkills = await MasterSkill.find({});
            const existingSkillsLower = user.skills.map(s => s.toLowerCase());

            allMasterSkills.forEach((masterSkill) => {
              const skillName = masterSkill.name.toLowerCase();
              
              // Only check if candidate doesn't already have it
              if (!existingSkillsLower.includes(skillName)) {
                // Use regex with word boundaries to prevent partial matches (e.g., "in" matching "in")
                // Escape regex characters just in case a skill has C++ or similar
                const escapedSkill = skillName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
                
                if (regex.test(resumeText)) {
                  newlyExtractedSkills.push(masterSkill.name);
                }
              }
            });

            if (newlyExtractedSkills.length > 0) {
              console.log("[Resume Parser] Extracted new skills:", newlyExtractedSkills);
              user.skills = [...user.skills, ...newlyExtractedSkills];
            }
          }
        } catch (parseError) {
          console.error("[Resume Parser] Failed to parse resume:", parseError);
          // Do not fail the profile update if parsing fails silently
        }
      }

      await user.save();

      res.status(200).json({
        message: "Profile updated successfully",
        user,
        extractedSkills: newlyExtractedSkills,
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

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update password" });
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

const extractSkills = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.resume) {
      return res.status(400).json({ message: "No resume found to extract skills from." });
    }

    console.log("[Resume Parser] Downloading saved resume for extraction...");
    const response = await fetch(user.resume);
    if (!response.ok) {
      throw new Error(`Failed to fetch resume from Cloudinary: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const parser = new PDFParse(uint8Array);
    const data = await parser.getText();
    const resumeText = data.text.toLowerCase();

    const allMasterSkills = await MasterSkill.find({});
    const existingSkillsLower = user.skills.map((s) => s.toLowerCase());
    let newlyExtractedSkills = [];

    allMasterSkills.forEach((masterSkill) => {
      const skillName = masterSkill.name.toLowerCase();
      if (!existingSkillsLower.includes(skillName)) {
        const escapedSkill = skillName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escapedSkill}\\b`, "i");
        if (regex.test(resumeText)) {
          newlyExtractedSkills.push(masterSkill.name);
        }
      }
    });

    if (newlyExtractedSkills.length > 0) {
      user.skills = [...user.skills, ...newlyExtractedSkills];
      await user.save();
    }

    res.status(200).json({
      message: newlyExtractedSkills.length > 0 
        ? `Successfully extracted ${newlyExtractedSkills.length} new skills!` 
        : "No new skills found in your resume.",
      user,
      extractedSkills: newlyExtractedSkills,
    });
  } catch (error) {
    console.error("[Resume Parser] Failed to extract skills:", error);
    res.status(500).json({ message: "Failed to parse resume or extract skills." });
  }
};

module.exports = {
  updateProfile,
  changePassword,
  toggleSaveJob,
  getSavedJobs,
  extractSkills,
};