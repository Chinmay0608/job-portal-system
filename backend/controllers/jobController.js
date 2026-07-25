const Job = require("../models/job");
const Application = require("../models/Application");
const User = require("../models/user");
const MasterSkill = require("../models/MasterSkill");
const jwt = require("jsonwebtoken");

/* ==========================
   CREATE JOB
========================== */
const createJob = async (req, res) => {
  try {
    const { title, role, company, location, salary, description } = req.body;

    if (!title || !role || !company || !location || !salary || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const job = await Job.create({
      title,
      role,
      company,
      location,
      salary,
      description,
      recruiter: req.user.id,
    });

    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   GET ALL JOBS
========================== */
const getAllJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      minSalary,
      experience,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: { $ne: false } };

    // 1. Filter out external jobs unless the user is the designated personal candidate
    const personalEmail = process.env.PERSONAL_CANDIDATE_EMAIL || "myemail@example.com";
    let isPersonalCandidate = false;

    let userSkills = [];
    if (req.cookies && req.cookies.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.email === personalEmail) {
          isPersonalCandidate = true;
          userSkills = user.skills || [];
        }
      } catch (e) {
        // Ignore invalid token
      }
    }

    if (isPersonalCandidate) {
      query.isExternal = true; // Only show real external jobs for the candidate
      // Enforce International Visa / Remote Rule
      query.$or = [
        { location: { $regex: /india/i } },
        { location: { $regex: /remote/i } },
        { description: { $regex: /visa|sponsorship|sponsor|relocation/i } }
      ];

      // Enforce strict resume skill filtering for the candidate
      if (userSkills && userSkills.length > 0) {
        const skillRegexes = userSkills.map(s => new RegExp(`^${s}$`, "i"));
        query.skillsRequired = { $in: skillRegexes };
      }
    } else {
      query.isExternal = { $ne: true }; // Only show mock/internal jobs for others
    }

    if (search) {
      // If $or already exists (from visa logic), we must use $and to combine them
      const searchCondition = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
        ],
      };
      
      if (query.$or) {
        query.$and = [searchCondition, { $or: query.$or }];
        delete query.$or;
      } else {
        query.$or = searchCondition.$or;
      }
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (experience && experience !== "All Experience") {
      // Check the experienceRequired field
      query.experienceRequired = experience;
    }

    // 2. Parse salary filter based on String comparison or numeric extraction if needed
    // Since we changed salary to String, minSalary filter might be tricky.
    // For simplicity, we skip minSalary filter for string salaries, or only apply it to numeric ones
    if (minSalary) {
      // Basic string matching or omit for now
    }

    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const perPage = Number(limit) > 0 ? Number(limit) : 20;

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate("recruiter", "name email")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    const totalPages = Math.ceil(totalJobs / perPage) || 1;

    res.status(200).json({
      jobs,
      totalJobs,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   GET RECRUITER JOBS
========================== */
const getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id });
    res.status(200).json({ jobs });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   GET RECOMMENDED JOBS
========================== */
const getRecommendedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Filter out external jobs unless it's the personal candidate
    const personalEmail = process.env.PERSONAL_CANDIDATE_EMAIL || "myemail@example.com";
    let query = { isActive: { $ne: false } };
    if (user.email === personalEmail) {
      query.isExternal = true;
      // Enforce International Visa / Remote Rule
      query.$or = [
        { location: { $regex: /india/i } },
        { location: { $regex: /remote/i } },
        { description: { $regex: /visa|sponsorship|sponsor|relocation/i } }
      ];
    } else {
      query.isExternal = { $ne: true };
    }

    const jobs = await Job.find(query);

    const recommendedJobs = jobs
      .map((job) => {
        const skillsRequired = Array.isArray(job.skillsRequired)
          ? job.skillsRequired
          : [];

        const matchedSkills = skillsRequired.filter((skill) =>
          user.skills?.some(
            (userSkill) =>
              userSkill.toLowerCase() === skill.toLowerCase()
          )
        );

        const matchPercentage =
          skillsRequired.length > 0
            ? Math.round(
                (matchedSkills.length / skillsRequired.length) * 100
              )
            : 0;

        return {
          ...job.toObject(),
          matchPercentage,
        };
      })
      .filter((job) => job.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      jobs: recommendedJobs,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ==========================
   UPDATE JOB
========================== */
const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, req.body, { new: true });

    res.status(200).json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   DELETE JOB
========================== */
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Job.findByIdAndDelete(jobId);

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

/* ==========================
   SEARCH MASTER SKILLS
========================== */
const searchMasterSkills = async (req, res) => {
  try {
    const { query } = req.query;

    // Return empty array if query is missing or empty
    if (!query || query.trim() === "") {
      return res.status(200).json([]);
    }

    // Case-insensitive anchored regex search for fast performance
    const skills = await MasterSkill.find({
      name: { $regex: `^${query.trim()}`, $options: "i" }
    }).limit(10);

    // Map to clean string array of skill names
    const skillNames = skills.map((skill) => skill.name);

    res.status(200).json(skillNames);
  } catch (error) {
    console.error("[searchMasterSkills] Database error:", error.message);
    res.status(500).json({ message: "Error searching skills" });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  deleteJob,
  updateJob,
  searchMasterSkills,
};