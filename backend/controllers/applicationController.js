const Application = require(
  "../models/Application"
);

const applyJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    const alreadyApplied =
      await Application.findOne({
        candidate: req.user.id,
        job: jobId,
      });

    if (alreadyApplied) {
      return res.status(400).json({
        message:
          "Already applied to this job",
      });
    }

    const application =
      await Application.create({
        candidate: req.user.id,
        job: jobId,
      });

    res.status(201).json({
      message:
        "Applied successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getMyApplications =
  async (req, res) => {
    try {
      const applications =
        await Application.find({
          candidate: req.user.id,
        })
          .populate(
            "job",
            "title company location salary"
          );

      res.status(200).json({
        applications,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server Error",
      });
    }
  };


const getRecruiterApplications =
  async (req, res) => {
    try {
      const applications =
        await Application.find()
          .populate(
            "candidate",
            "name email resume"
          )
          .populate(
            "job",
            "title company recruiter"
          );

      const recruiterApplications =
        applications.filter(
          (application) =>
            application.job &&
            application.job.recruiter.toString() ===
              req.user.id
        );

      res.status(200).json({
        applications:
          recruiterApplications,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server Error",
      });
    }
  };

  const updateApplicationStatus =
  async (req, res) => {
    try {
      const { applicationId } =
        req.params;

      const { status } =
        req.body;

      const application =
        await Application.findById(
          applicationId
        ).populate("job");

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      if (
        application.job.recruiter.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          message:
            "Access denied",
        });
      }

      application.status = status;

      await application.save();

      res.status(200).json({
        message:
          "Application status updated",
        application,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Server Error",
      });
    }
  };
  
module.exports = {
  applyJob,
  getMyApplications,
  getRecruiterApplications,
  updateApplicationStatus
};