const fs = require('fs');
const path = 'D:/MERN Project/job-portal/backend/controllers/applicationController.js';
let content = fs.readFileSync(path, 'utf8');

const adminLogic = `
const getApplicationsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { status, search } = req.query;

  const filter = {};
  if (status) filter.status = status;

  // Search by candidate name/email or job title/company requires manual joining or regex across populated fields.
  // For simplicity and speed without complex aggregations, we'll do basic application level filtering,
  // and handle populated search in memory if 'search' is provided (since we have pagination, doing it perfectly requires aggregation pipeline).
  // Real-world: use aggregation pipeline with $lookup.
  // Here we'll just implement status filtering directly and basic stats.

  // Summary Stats
  const totalApps = await Application.countDocuments();
  const pendingApps = await Application.countDocuments({ status: "pending" });
  const shortlistedApps = await Application.countDocuments({ status: "shortlisted" });
  const rejectedApps = await Application.countDocuments({ status: "rejected" });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appsToday = await Application.countDocuments({ appliedAt: { $gte: today } });

  const stats = {
    total: totalApps,
    pending: pendingApps,
    shortlisted: shortlistedApps,
    rejected: rejectedApps,
    addedToday: appsToday
  };

  // Get applications
  const skip = (page - 1) * limit;
  let applications = await Application.find(filter)
    .sort({ appliedAt: -1 })
    .populate("candidate", "name email resume")
    .populate("job", "title company isExternal applyUrl")
    .skip(skip)
    .limit(limit)
    .lean();

  // Basic in-memory search for the current page (fallback for full-text search)
  if (search) {
    const s = search.toLowerCase();
    applications = applications.filter(app => {
      const cName = app.candidate?.name?.toLowerCase() || "";
      const cEmail = app.candidate?.email?.toLowerCase() || "";
      const jTitle = app.job?.title?.toLowerCase() || "";
      const jComp = app.job?.company?.toLowerCase() || "";
      return cName.includes(s) || cEmail.includes(s) || jTitle.includes(s) || jComp.includes(s);
    });
  }

  const totalFiltered = await Application.countDocuments(filter);
  const totalPages = Math.ceil(totalFiltered / limit) || 1;

  res.status(200).json({
    applications,
    stats,
    page,
    totalPages,
    totalApplications: totalFiltered
  });
});
`;

if (!content.includes('getApplicationsAdmin')) {
  content = content.replace(/module\.exports\s*=\s*\{/, adminLogic + '\nmodule.exports = {\n  getApplicationsAdmin,');
  fs.writeFileSync(path, content);
  console.log('Added getApplicationsAdmin to applicationController.js');
}
