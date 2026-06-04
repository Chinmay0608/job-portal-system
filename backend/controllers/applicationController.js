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
        resume: req.file?.path,
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

      // Prefix resume paths with full backend URL so frontend opens correctly
      const host = req.protocol + '://' + req.get('host');
      const apps = applications.map((app) => {
        const obj = app.toObject();
        if (obj.candidate && obj.candidate.resume && !obj.candidate.resume.startsWith('http')) {
          obj.candidate.resume = host + '/' + obj.candidate.resume;
        }
        return obj;
      });

      res.status(200).json({
        applications: apps,
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

      // Prefix resume paths with backend URL so links work from frontend
      const host = req.protocol + '://' + req.get('host');
      const apps = recruiterApplications.map((app) => {
        const obj = app.toObject();
        if (obj.candidate && obj.candidate.resume && !obj.candidate.resume.startsWith('http')) {
          obj.candidate.resume = host + '/' + obj.candidate.resume;
        }
        return obj;
      });

      res.status(200).json({
        applications: apps,
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

        const {
          applicationId
        } = req.params;

        const {
          status
        } = req.body;

        const application =
          await Application
            .findById(
              applicationId
            )
            .populate({
              path : "job",
              select : "recruiter",
            });

        if (!application) {
          return res.status(404).json({
            message:
              "Application not found",
          });
        }

        if (
          !application.job
        ) {
          return res.status(404).json({
            message:
              "Job not found",
          });
        }

        console.log(
          application.job
        );

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

        // Skip full schema validation when updating status to allow
        // existing applications that may be missing optional/required
        // fields (like legacy records without resume) to be updated.
        await application.save({ validateBeforeSave: false });

        res.status(200).json({
          message:
            "Application status updated successfully",
          application,
        });

      } catch (error) {

        console.log(
          error
        );

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
  updateApplicationStatus,
};