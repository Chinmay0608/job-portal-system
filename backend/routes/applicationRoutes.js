const express =
  require(
    "express"
  );

const {
  applyJob,
  getMyApplications,
  getRecruiterApplications,
  getRecruiterStats,
  updateApplicationStatus
} = require(
  "../controllers/applicationController"
);

const {
  protect,
  authorizeRoles
} = require(
  "../middleware/authMiddleware"
);

const upload =
  require(
    "../middleware/multer"
  );

const router =
  express.Router();

router.post(
  "/apply",
  protect,
  authorizeRoles(
    "candidate"
  ),
  upload.single(
    "resume"
  ),
  applyJob
);

router.get(
  "/my-applications",
  protect,
  authorizeRoles(
    "candidate"
  ),
  getMyApplications
);

router.get(
  "/recruiter-applications",
  protect,
  authorizeRoles(
    "recruiter"
  ),
  getRecruiterApplications
);

router.get(
  "/recruiter-stats",
  protect,
  authorizeRoles(
    "recruiter"
  ),
  getRecruiterStats
);

router.patch(
  "/update/:applicationId",
  protect,
  authorizeRoles(
    "recruiter"
  ),
  updateApplicationStatus
);

module.exports =
  router;