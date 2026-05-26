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

module.exports = {
  applyJob,
  getMyApplications,
};