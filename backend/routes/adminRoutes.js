const express = require('express');
const router = express.Router();
const HealthMonitor = require('../services/sde/HealthMonitor');
const CrawlDeltaLog = require('../models/CrawlDeltaLog');
const Company = require('../models/Company');
const RawJobPayload = require('../models/RawJobPayload');
const Job = require('../models/job');
const User = require('../models/user');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const SecurityLog = require('../models/SecurityLog');
const AiUsageLog = require('../models/AiUsageLog');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { logSecurityEvent } = require('../middleware/securityAuditMiddleware');

const isAdminUser = (user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const seedEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const userEmail = user.email?.toLowerCase();
  if (seedEmail && userEmail === seedEmail) return true;
  if (userEmail === 'admin@gmail.com') return true;
  return false;
};

router.get('/sde/health', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const metrics = await HealthMonitor.getMetrics();
    
    // Get today's global deltas with fallback to latest crawl log or live job counts
    const date = new Date().toISOString().split('T')[0];
    let todayDeltas = await CrawlDeltaLog.findOne({ date });

    if (!todayDeltas) {
      const latestLog = await CrawlDeltaLog.findOne({}).sort({ createdAt: -1 });
      if (latestLog) {
        todayDeltas = {
          newJobs: latestLog.newJobs || 0,
          updatedJobs: latestLog.updatedJobs || 0,
          expiredJobs: latestLog.expiredJobs || 0,
          unchangedJobs: latestLog.unchangedJobs || 0,
          failedJobs: latestLog.failedJobs || 0,
        };
      } else {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const newJobsToday = await Job.countDocuments({ createdAt: { $gte: todayStart } });
        const updatedJobsToday = await Job.countDocuments({ updatedAt: { $gte: todayStart }, createdAt: { $lt: todayStart } });
        const activeTotal = await Job.countDocuments({ isActive: true });
        const unchangedJobs = Math.max(0, activeTotal - newJobsToday - updatedJobsToday);

        todayDeltas = {
          newJobs: newJobsToday,
          updatedJobs: updatedJobsToday,
          expiredJobs: 0,
          unchangedJobs,
          failedJobs: 0
        };
      }
    }

    // Get Top Hiring Companies directly from Job collection
    const topHiringAgg = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    let topHiring = topHiringAgg.map((item) => ({
      name: item._id || "Unknown Company",
      count: item.count,
    }));

    if (topHiring.length === 0) {
      const rawAgg = await RawJobPayload.aggregate([
        { $group: { _id: "$companyId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      for (const agg of rawAgg) {
        const comp = await Company.findById(agg._id);
        if (comp) topHiring.push({ name: comp.name, count: agg.count });
      }
    }

    // Get Failed Companies (Latest 5 FAILED_VALIDATION)
    const failedCompanies = await Company.find({ status: 'FAILED_VALIDATION' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name website');

    const totalJobsCount = await Job.countDocuments({});

    const result = {
      registrySize: totalJobsCount > 0 ? totalJobsCount : ((metrics.active || 0) + (metrics.stale || 0) + (metrics.dormant || 0) + (metrics.discovered || 0) + (metrics.verified || 0)),
      platformDistribution: metrics.platforms,
      crawlerSuccess: metrics.crawlerSuccessRate,
      averageCrawlTime: metrics.averageCrawlTimeMs,
      todayDeltas,
      topHiring,
      failedCompanies
    };

    res.json(result);
  } catch (error) {
    console.error('[Admin API] Error fetching SDE health:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.get('/users', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('[Admin API] Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /api/admin/users/:id - Delete a user account and clean up associated applications
router.delete('/users/:id', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!isAdminUser(adminUser)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (isAdminUser(targetUser)) {
      return res.status(400).json({ error: 'Cannot delete primary admin account' });
    }

    // Cascade delete candidate's applications
    await Application.deleteMany({ candidate: req.params.id });

    // Cascade delete recruiter's posted jobs & their applications if recruiter
    if (targetUser.role === 'recruiter' || targetUser.role === 'admin') {
      const recruiterJobs = await Job.find({ recruiter: req.params.id }).select('_id');
      const jobIds = recruiterJobs.map(j => j._id);
      if (jobIds.length > 0) {
        await Application.deleteMany({ job: { $in: jobIds } });
        await Job.deleteMany({ recruiter: req.params.id });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    logSecurityEvent('USER_DELETED', 'HIGH', req, { targetEmail: targetUser.email, targetRole: targetUser.role });

    res.json({ message: 'User and associated records deleted successfully' });
  } catch (error) {
    console.error('[Admin API] Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PATCH /api/admin/users/:id/role - Change user role
router.patch('/users/:id/role', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!isAdminUser(adminUser)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const { role } = req.body;
    if (!['candidate', 'recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const targetUser = await User.findById(req.params.id);
    const oldRole = targetUser?.role;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    logSecurityEvent('ROLE_CHANGE', 'MEDIUM', req, { targetEmail: targetUser?.email, oldRole, newRole: role });

    res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('[Admin API] Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/jobs - Get all jobs in registry with server-side pagination
router.get('/jobs', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const { search, page = 1, limit = 50 } = req.query;
    let query = {};
    if (search && search.trim()) {
      const term = search.trim();
      query = {
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { company: { $regex: term, $options: 'i' } },
          { location: { $regex: term, $options: 'i' } },
          { source: { $regex: term, $options: 'i' } },
        ]
      };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(500, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      jobs,
      totalJobs,
      page: pageNum,
      totalPages: Math.ceil(totalJobs / limitNum),
      limit: limitNum
    });
  } catch (error) {
    console.error('[Admin API] Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// DELETE /api/admin/jobs/:id - Delete job from registry
router.delete('/jobs/:id', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const targetJob = await Job.findById(req.params.id);
    await Job.findByIdAndDelete(req.params.id);

    logSecurityEvent('JOB_DELETED', 'MEDIUM', req, { jobTitle: targetJob?.title, company: targetJob?.company });

    res.json({ message: 'Job removed from registry successfully' });
  } catch (error) {
    console.error('[Admin API] Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// GET /api/admin/applications - Get all platform applications
router.get('/applications', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const applications = await Application.find({})
      .populate('candidate', 'name email phone location skills resume')
      .populate('job', 'title company location salary isExternal source')
      .sort({ createdAt: -1 });

    const validApplications = applications.filter(app => app.candidate != null);

    res.json(validApplications);
  } catch (error) {
    console.error('[Admin API] Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/admin/security/logs - Get Security Audit Logs
router.get('/security/logs', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const { severity, eventType, limit = 100 } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (eventType) filter.eventType = eventType;

    const logs = await SecurityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const totalLogs = await SecurityLog.countDocuments();
    const criticalCount = await SecurityLog.countDocuments({ severity: 'CRITICAL' });
    const highCount = await SecurityLog.countDocuments({ severity: 'HIGH' });

    res.json({ logs, totalLogs, criticalCount, highCount });
  } catch (error) {
    console.error('[Admin API] Error fetching security logs:', error);
    res.status(500).json({ error: 'Failed to fetch security logs' });
  }
});

// GET /api/admin/ai/usage - Get AI Usage Analytics
router.get('/ai/usage', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const logs = await AiUsageLog.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    const totalQueries = await AiUsageLog.countDocuments();

    const statsAgg = await AiUsageLog.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$totalTokens" },
          totalCost: { $sum: "$estimatedCostUsd" },
          avgLatency: { $avg: "$responseTimeMs" }
        }
      }
    ]);

    const stats = statsAgg[0] || { totalTokens: 0, totalCost: 0, avgLatency: 0 };

    const topUsers = await AiUsageLog.aggregate([
      {
        $group: {
          _id: "$userEmail",
          userName: { $first: "$userName" },
          count: { $sum: 1 },
          tokens: { $sum: "$totalTokens" },
          cost: { $sum: "$estimatedCostUsd" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ logs, totalQueries, stats, topUsers });
  } catch (error) {
    console.error('[Admin API] Error fetching AI usage:', error);
    res.status(500).json({ error: 'Failed to fetch AI usage' });
  }
});

// POST /api/admin/ai/log - Record AI interaction log
router.post('/ai/log', async (req, res) => {
  try {
    const { userEmail, userName, feature, model, promptTokens, completionTokens, totalTokens, estimatedCostUsd, responseTimeMs, status } = req.body;

    const log = await AiUsageLog.create({
      userEmail: userEmail || 'anonymous@candidate.com',
      userName: userName || 'Candidate',
      feature: feature || 'AI_CAREER_COACH',
      model: model || 'gemini-2.5-flash',
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      totalTokens: totalTokens || 0,
      estimatedCostUsd: estimatedCostUsd || 0,
      responseTimeMs: responseTimeMs || 0,
      status: status || 'SUCCESS'
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('[Admin API] Error recording AI log:', error);
    res.status(500).json({ error: 'Failed to record AI log' });
  }
});

// GET /api/admin/candidate-activity — Full candidate activity: applications + My Jobs (saved) cross-reference
router.get('/candidate-activity', protect, authorizeRoles('recruiter', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }

    const { search, limit = 200 } = req.query;

    // Fetch all applications with candidate + job populated
    let query = {};
    if (search && search.trim()) {
      const candidates = await User.find({
        $or: [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } }
        ],
        role: 'candidate'
      }).select('_id');
      query = { candidate: { $in: candidates.map(c => c._id) } };
    }

    const applications = await Application.find(query)
      .populate('candidate', 'name email skills location experienceLevel createdAt')
      .populate('job', 'title company location salary isExternal source createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Filter out orphaned applications (candidate or job deleted)
    const validApps = applications.filter(app => app.candidate != null && app.job != null);

    // For each application, check if the candidate also had this job saved (in My Jobs)
    const enriched = await Promise.all(
      validApps.map(async (app) => {
        const savedEntry = await SavedJob.findOne({
          candidate: app.candidate._id,
          job: app.job._id
        }).select('createdAt').lean();

        return {
          _id: app._id,
          appliedAt: app.createdAt,
          status: app.status,
          candidate: {
            _id: app.candidate._id,
            name: app.candidate.name,
            email: app.candidate.email,
            skills: app.candidate.skills || [],
            location: app.candidate.location || '',
            experienceLevel: app.candidate.experienceLevel || 'Fresher',
          },
          job: {
            _id: app.job._id,
            title: app.job.title,
            company: app.job.company,
            location: app.job.location,
            salary: app.job.salary,
            isExternal: app.job.isExternal,
            source: app.job.source,
          },
          // Was this job also saved in the candidate's "My Jobs" section?
          savedInMyJobs: !!savedEntry,
          savedAt: savedEntry?.createdAt || null,
        };
      })
    );

    // Summary stats
    const totalApplications = enriched.length;
    const savedAndApplied = enriched.filter(a => a.savedInMyJobs).length;
    const directApply = totalApplications - savedAndApplied;
    const uniqueCandidates = new Set(enriched.map(a => String(a.candidate._id))).size;

    res.json({
      activities: enriched,
      stats: {
        totalApplications,
        uniqueCandidates,
        savedAndApplied,   // candidate saved the job in My Jobs AND applied
        directApply,       // candidate applied without saving first
        savedRatio: totalApplications > 0
          ? Math.round((savedAndApplied / totalApplications) * 100)
          : 0,
      }
    });
  } catch (error) {
    console.error('[Admin API] Error fetching candidate activity:', error);
    res.status(500).json({ error: 'Failed to fetch candidate activity' });
  }
});

const { getConfig, setConfig, getCompaniesAdmin, updateCompanyAdmin } = require('../controllers/adminConfigController');

// Config Routes
router.get('/config', protect, authorizeRoles('recruiter', 'admin'), getConfig);
router.put('/config/:key', protect, authorizeRoles('recruiter', 'admin'), setConfig);

// Company Registry Admin Routes
router.get('/companies', protect, authorizeRoles('recruiter', 'admin'), getCompaniesAdmin);
router.put('/companies/:id', protect, authorizeRoles('recruiter', 'admin'), updateCompanyAdmin);

module.exports = router;
