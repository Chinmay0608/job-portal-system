const Job = require("../models/Job");
const Application = require("../models/Application");

const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      salary,
      description,
    } = req.body;

    const job = await Job.create({
      title,
      company,
      location,
      salary,
      description,
      recruiter: req.user.id,
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("recruiter", "name email");

    res.status(200).json({
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getRecruiterJobs =
  async (
    req,
    res
  ) => {

    try {

      const jobs =
        await Job.find({
          recruiter:
            req.user.id,
        });

      res.status(200)
        .json({
          jobs,
        });

    } catch (
      error
    ) {

      res.status(500)
        .json({
          message:
            "Server Error",
        });
    }
  };

  const deleteJob =
    async (
      req,
      res
    ) => {

      try {

        const {
          jobId,
        } = req.params;

        const job =
          await Job.findById(
            jobId
          );

        if (!job) {
          return res.status(404)
            .json({
              message:
                "Job not found",
            });
        }

        if (
          job.recruiter.toString() !==
          req.user.id
        ) {
          return res.status(403)
            .json({
              message:
                "Access denied",
            });
        }

        await Job.findByIdAndDelete(
          jobId
        );

        res.status(200)
          .json({
            message:
              "Job deleted successfully",
          });

      } catch (
        error
      ) {

        res.status(500)
          .json({
            message:
              "Server Error",
          });
      }
    };

const applyJob = async (req,res) => {
  try {

    const {
      jobId
    } = req.body;

    const job =
      await Job.findById(
        jobId
      );

    if (!job) {
      return res
        .status(404)
        .json({
          message:
            "Job not found",
        });
    }

    const existing =
      await Application.findOne({
        candidate:
          req.user.id,
        job:
          jobId,
      });

    if (existing) {
      return res
        .status(400)
        .json({
          message:
            "You have already applied for this job",
        });
    }

    const application =
      await Application.create({
        candidate:
          req.user.id,

        job:
          jobId,

        /* Cloudinary URL */
        resume:
          req.file?.path,
      });

    res.status(201)
      .json({
        message:
          "Applied Successfully",
        application,
      });

  } catch (error) {

    console.log(error);

    res.status(500)
      .json({
        message:
          "Server Error",
      });
  }
};

const updateJob =
  async (req, res) => {

    try {

      const { jobId } =
        req.params;

      const job =
        await Job.findById(
          jobId
        );

      if (!job) {
        return res.status(404).json({
          message:
            "Job not found",
        });
      }

      // recruiter check
      if (
        job.recruiter.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      const updatedJob =
        await Job.findByIdAndUpdate(
          jobId,
          req.body,
          {
            new: true,
          }
        );

      res.status(200).json({
        message:
          "Job updated successfully",
        job:
          updatedJob,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message:
          "Server Error",
      });
    }
  };

module.exports = {
  createJob,
  getAllJobs,
  getRecruiterJobs,
  deleteJob,
  applyJob,
  updateJob,
};