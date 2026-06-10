const Application =
  require(
    "../models/Application"
  );

const cloudinary =
  require(
    "../config/cloudinary"
  );

const applyJob =
  async (req, res) => {

    try {

      const {
        jobId
      } = req.body;

      const alreadyApplied =
        await Application.findOne({
          candidate:
            req.user.id,

          job:
            jobId,
        });

      if (
        alreadyApplied
      ) {
        return res.status(400)
          .json({
            message:
              "Already applied to this job",
          });
      }

      let resumeUrl =
        "";

      if (
        req.file
      ) {

        const uploadedFile =
          await new Promise(
            (
              resolve,
              reject
            ) => {

              cloudinary
                .uploader
                .upload_stream(

                  {
                    folder:
                      "skillbridge_resumes",

                    resource_type:
                      "raw",
                  },

                  (
                    error,
                    result
                  ) => {

                    if (
                      error
                    ) {
                      reject(
                        error
                      );

                    } else {

                      resolve(
                        result
                      );
                    }
                  }
                )
                .end(
                  req.file.buffer
                );
            }
          );

        resumeUrl =
          uploadedFile
            .secure_url;
      }

      const application =
        await Application
          .create({

            candidate:
              req.user.id,

            job:
              jobId,

            resume:
              resumeUrl,
          });

      res.status(201)
        .json({
          message:
            "Applied successfully",

          application,
        });

    } catch (error) {

      console.log(
        error
      );

      res.status(500)
        .json({
          message:
            error.message,
        });
    }
  };

const getMyApplications =
  async (req, res) => {

    try {

      const applications =
        await Application
          .find({
            candidate:
              req.user.id,
          })
          .populate(
            "job",
            `
              title
              company
              location
              salary
            `
          );

      res.status(200)
        .json({
          applications,
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

const getRecruiterApplications =
  async (req, res) => {

    try {

      const applications =
        await Application
          .find()
          .populate(
            "candidate",
            `
              name
              email
              resume
            `
          )
          .populate(
            "job",
            `
              title
              company
              recruiter
            `
          );

      const recruiterApplications =
        applications.filter(
          (
            application
          ) =>
            application.job &&
            application
              .job
              .recruiter
              .toString() ===
            req.user.id
        );

      res.status(200)
        .json({
          applications:
            recruiterApplications,
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
            path:
              "job",

            select:
              "recruiter",
          });

      if (
        !application
      ) {
        return res.status(404)
          .json({
            message:
              "Application not found",
          });
      }

      if (
        !application.job
      ) {
        return res.status(404)
          .json({
            message:
              "Job not found",
          });
      }

      if (
        application
          .job
          .recruiter
          .toString() !==
        req.user.id
      ) {

        return res.status(403)
          .json({
            message:
              "Access denied",
          });
      }

      application.status =
        status;

      await application.save({
        validateBeforeSave:
          false,
      });

      res.status(200)
        .json({
          message:
            "Application status updated successfully",

          application,
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
  applyJob,
  getMyApplications,
  getRecruiterApplications,
  updateApplicationStatus,
};