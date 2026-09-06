const Job = require("../models/job");
const User = require("../models/user");
const Application = require("../models/Application"); // FIX I-03: Correct casing (Linux FS is case-sensitive)
const MasterSkill = require("../models/MasterSkill");
const { calculateJobMatches } = require("../services/jobMatchService");
const { clearCache } = require("../middleware/cacheMiddleware");
const asyncHandler = require("express-async-handler");

// Helper to escape regex characters and prevent ReDoS
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* ==========================
   GENERATE AI JOB DESCRIPTION
========================== */
const { GoogleGenAI } = require('@google/genai');

const generateJobDescription = asyncHandler(async (req, res) => {
  const { title, company, role } = req.body;
  if (!title || !company) {
    res.status(400);
    throw new Error('Title and Company are required to generate a description');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Act as an expert technical recruiter. Write a professional, comprehensive, and engaging job description for the following position:
  
  Job Title: ${title}
  Company: ${company}
  Role Type: ${role || 'Full-time'}
  
  The description should be formatted with clean HTML tags (like <h3>, <p>, <ul>, <li>, <strong>) and include:
  1. A compelling "About the Role" section
  2. "Key Responsibilities" (bullet points)
  3. "Requirements & Qualifications" (bullet points)
  4. "What We Offer" (perks/benefits)
  
  Return ONLY the HTML output. Do not include markdown codeblocks or any conversational wrapper text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    
    let description = response.text.trim();
    if (description.startsWith('```html')) description = description.slice(7);
    if (description.startsWith('```')) description = description.slice(3);
    if (description.endsWith('```')) description = description.slice(0, -3);
    
    res.status(200).json({ description: description.trim() });
  } catch (error) {
    console.error('[Gemini AI Error]:', error);
    res.status(500).json({ message: 'Failed to generate job description', error: error.message });
  }
});

/* ==========================
   CREATE JOB
========================== */
const createJob = asyncHandler(async (req, res) => {
  const { title, role, company, location, salary, description } = req.body;

  if (!title || !role || !company || !location || !salary || !description) {
    res.status(400);
    throw new Error("All fields are required");
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

  await clearCache("/api/jobs");

  res.status(201).json({ message: "Job created successfully", job });
});

/* ==========================
   GET ALL JOBS
========================== */

// Helper to build active jobs query dynamically (compensates for sleeping cron jobs on free tiers)
const getBaseActiveJobQuery = () => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return {
    isActive: { $ne: false },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ],
    updatedAt: { $gte: ninetyDaysAgo }
  };
};

const getAllJobs = asyncHandler(async (req, res) => {
  const {
    search,
    location,
    minSalary,
    experience,
    source,
    isRemote,
    employmentType,
    page = 1,
    limit = 20,
  } = req.query;

  const query = getBaseActiveJobQuery();

  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user && user.hiddenJobs && user.hiddenJobs.length > 0) {
      query._id = { $nin: user.hiddenJobs };
    }
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    // TODO: Switch to $text search for better efficiency instead of $regex
    const searchCondition = {
      $or: [
        { title: { $regex: safeSearch, $options: "i" } },
        { company: { $regex: safeSearch, $options: "i" } },
        { keywords: { $regex: safeSearch, $options: "i" } }
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
    const locLower = location.trim().toLowerCase();
    if (locLower === "remote") {
      query.isRemote = true;
    } else if (locLower === "india" || locLower === "in") {
      const indianLocs = [
        "india", "bengaluru", "bangalore", "mumbai", "delhi", "noida", "gurgaon", "gurugram", 
        "hyderabad", "chennai", "pune", "jaipur", "kolkata", "ahmedabad", "surat", "chandigarh", "kochi", "in-"
      ];
      query.location = { $regex: indianLocs.map(escapeRegex).join("|"), $options: "i" };
    } else if (locLower === "us" || locLower === "usa" || locLower === "united states") {
      const usLocs = ["us", "usa", "united states", "san francisco", "sf", "nyc", "new york", "seattle", "austin", "chicago", "boston", "la", "los angeles"];
      query.location = { $regex: usLocs.map(escapeRegex).join("|"), $options: "i" };
    } else {
      query.location = { $regex: escapeRegex(location), $options: "i" };
    }
  }

  if (experience && experience !== "All Experience") {
    query.experienceRequired = experience;
  }

  if (source && source !== "All") {
    // FIX I-13: Use case-insensitive comparison — frontend sends "internal" (lowercase)
    // but controller was checking "Internal" (capital I), causing the filter to never match.
    const sourceLower = source.toLowerCase();
    if (sourceLower === "internal") {
      query.isExternal = { $ne: true };
    } else {
      query.source = source;
    }
  }

  if (isRemote === "true") {
    query.isRemote = true;
  }

  if (employmentType && employmentType !== "All") {
    query.employmentType = employmentType;
  }

  if (minSalary && !isNaN(minSalary)) {
    query.salaryMin = { $gte: Number(minSalary) };
  }

  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const perPage = Number(limit) > 0 ? Number(limit) : 20;

  const totalJobs = await Job.countDocuments(query);
  const jobs = await Job.find(query)
    .populate("recruiter", "name email")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  const totalPages = Math.ceil(totalJobs / perPage) || 1;

  res.status(200).json({
    jobs,
    totalJobs,
    totalPages,
    currentPage,
  });
});

/* ==========================
   GET RECRUITER JOBS
========================== */
const getRecruiterJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const perPage = Number(limit) > 0 ? Number(limit) : 20;

  const query = { recruiter: req.user.id };

  const totalJobs = await Job.countDocuments(query);
  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * perPage)
    .limit(perPage);

  const totalPages = Math.ceil(totalJobs / perPage) || 1;

  res.status(200).json({ 
    jobs,
    totalJobs,
    totalPages,
    currentPage,
  });
});

/* ==========================
   GET RECOMMENDED JOBS
========================== */
const getRecommendedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Show all active jobs (both internal and external)
  let query = getBaseActiveJobQuery();

  if (user && user.hiddenJobs && user.hiddenJobs.length > 0) {
    query._id = { $nin: user.hiddenJobs };
  }

  const jobs = await Job.find(query);

  // Scores jobs against candidate's field & skills, filtering out domain mismatches (like Marketing)
  const recommendedJobs = calculateJobMatches(jobs, user);

  res.status(200).json({
    jobs: recommendedJobs,
  });
});

/* ==========================
   AI CAREER COACH ASSISTANT
========================== */
const aiCareerCoach = asyncHandler(async (req, res) => {
  const { messages } = req.body;
  const user = await User.findById(req.user.id);
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const lastMsg = (messages?.[messages.length - 1]?.content || "").trim();
  const lastMsgLower = lastMsg.toLowerCase();
  const userSkills = user.skills || [];
  const userField = user.field || "Software Engineering";

  // 1. Detect candidate intent and tech/domain keywords
  let searchKeyword = "";
  const commonKeywords = ["java", "python", "react", "node", "express", "javascript", "c++", "aws", "docker", "frontend", "backend", "fullstack", "data", "marketing", "sales", "design", "remote", "devops", "sql", "mongodb"];
  for (const kw of commonKeywords) {
    if (lastMsgLower.includes(kw)) {
      searchKeyword = kw;
      break;
    }
  }

  // 2. Query matching active jobs from Database
  let matchedJobs = [];
  const jobQuery = { isActive: { $ne: false } };

  if (searchKeyword) {
    const safeKw = escapeRegex(searchKeyword);
    jobQuery.$or = [
      { title: { $regex: safeKw, $options: "i" } },
      { description: { $regex: safeKw, $options: "i" } },
      { keywords: { $regex: safeKw, $options: "i" } },
      { skillsRequired: { $regex: safeKw, $options: "i" } },
    ];
  } else if (userField) {
    const safeField = escapeRegex(userField);
    jobQuery.$or = [
      { role: { $regex: safeField, $options: "i" } },
      { title: { $regex: safeField, $options: "i" } },
      { description: { $regex: safeField, $options: "i" } },
      { keywords: { $regex: safeField, $options: "i" } },
    ];
  }

  try {
    matchedJobs = await Job.find(jobQuery).limit(5).lean();
  } catch (e) {
    console.error("Error fetching jobs for AI coach:", e);
  }

  if (matchedJobs.length === 0) {
    try {
      matchedJobs = await Job.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).limit(5).lean();
    } catch (e) {}
  }

  // 3. Build dynamic smart reply
  const buildSmartFallbackReply = () => {
    if (lastMsgLower.includes("skill gap") || lastMsgLower.includes("gap") || lastMsgLower.includes("analyze")) {
      const allRequiredSkills = new Set();
      matchedJobs.forEach((j) => {
        if (Array.isArray(j.skillsRequired)) {
          j.skillsRequired.forEach((s) => allRequiredSkills.add(s.trim()));
        } else if (typeof j.skillsRequired === "string" && j.skillsRequired.trim()) {
          j.skillsRequired.split(",").forEach((s) => allRequiredSkills.add(s.trim()));
        }
      });

      const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));
      const missingSkills = Array.from(allRequiredSkills).filter(
        (s) => s && !userSkillSet.has(s.toLowerCase())
      );

      return `**Skill Gap Analysis for ${user.name} (${userField})**:

• **Your Active Skills**: ${userSkills.length > 0 ? userSkills.join(", ") : "None specified"}
• **In-Demand Skills in ${userField}**: ${missingSkills.slice(0, 5).join(", ") || "Docker, Microservices, System Design, AWS"}

💡 **Action Plan**: Adding 2-3 of these in-demand skills to your profile can boost your match score by up to **35%**!`;
    }

    if (searchKeyword || lastMsgLower.includes("job") || lastMsgLower.includes("role") || lastMsgLower.includes("recommend") || lastMsgLower.includes("top") || lastMsgLower.includes("provide") || lastMsgLower.includes("show")) {
      if (matchedJobs.length > 0) {
        const jobListStr = matchedJobs
          .slice(0, 3)
          .map((j, i) => {
            const salaryStr = j.salary && Number(j.salary) > 0 
              ? `💼 $${Number(j.salary).toLocaleString()}` 
              : "💼 Competitive Salary";
            
            let skillsStr = "";
            if (Array.isArray(j.skillsRequired) && j.skillsRequired.length > 0) {
              skillsStr = j.skillsRequired.join(", ");
            } else if (typeof j.skillsRequired === "string" && j.skillsRequired.trim()) {
              skillsStr = j.skillsRequired;
            } else {
              skillsStr = "Domain & Full-stack Skills";
            }

            return `${i + 1}. **${j.title}** at **${j.company}**\n   📍 ${j.location || "Remote"} | ${salaryStr}\n   ⚡ Skills: ${skillsStr}`;
          })
          .join("\n\n");

        return `Here are top active **${searchKeyword ? searchKeyword.toUpperCase() : userField.toUpperCase()}** openings matching your profile:

${jobListStr}

💡 **Career Tip**: Ensure these skills are listed on your profile to maximize your match score!`;
      }
    }

    if (lastMsgLower.includes("interview") || lastMsgLower.includes("prep") || lastMsgLower.includes("tip")) {
      return `**Interview Preparation Tips for ${userField} Roles**:

1. **Highlight Technical Projects**: Be ready to explain 2 key projects featuring your skills (${userSkills.slice(0, 3).join(", ") || "your primary stack"}).
2. **System & Problem Solving**: Practice common ${userField} interview questions and technical architecture trade-offs.
3. **STAR Method**: Structure behavioral responses around Situation, Task, Action, and Result.`;
    }

    return `Hello **${user.name}**! I analyzed your profile in **${userField}** (Skills: ${userSkills.join(", ") || "None listed"}).

I can help you:
• **Search roles** (e.g. "show me Software Engineering jobs")
• **Analyze your skill gaps** (e.g. "Analyze my skill gaps")
• **Get interview tips** for ${userField}`;
  };

  const groqApiKey = process.env.GROQ_API_KEY;

  if (groqApiKey && groqApiKey.startsWith("gsk_")) {
    try {
      const axios = require("axios");
      const jobSummaries = matchedJobs
        .map(
          (j) =>
            `${j.title} at ${j.company} (${j.location}, Salary: ${j.salary && Number(j.salary) > 0 ? '$' + Number(j.salary).toLocaleString() : 'Competitive Salary'}, Skills: ${
              Array.isArray(j.skillsRequired) && j.skillsRequired.length > 0
                ? j.skillsRequired.join(", ")
                : (typeof j.skillsRequired === 'string' && j.skillsRequired.trim() ? j.skillsRequired : 'Domain Relevant Skills')
            })`
        )
        .join("\n");

      const systemPrompt = `You are SkillBridge's AI Career Coach & Skill Analyst.
Candidate Context:
- Name: ${user.name}
- Target Domain: ${userField}
- Experience Level: ${user.experienceLevel || "Fresher"}
- Skills: ${userSkills.join(", ") || "React, JavaScript"}

Available Matching Jobs in Database:
${jobSummaries || "No direct matches found"}

Formatting Instructions:
- Format job listings cleanly with numbered titles (**Job Title** at **Company**).
- Use clear icons: 📍 for location, 💼 for salary (never output $0, use Competitive Salary if zero), ⚡ for skills.
- Format key recommendations with bullet points and bolding (**bold**). Keep responses crisp, professional, and encouraging.`;

      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: lastMsg },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const reply = groqRes.data?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return res.status(200).json({ role: "assistant", content: reply });
      }
    } catch (error) {
      console.error("Groq AI Coach Error:", error?.response?.data || error.message);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("AQ.")) {
    return res.status(200).json({ role: "assistant", content: buildSmartFallbackReply() });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const jobSummaries = matchedJobs.map(j => `${j.title} at ${j.company} (${j.location}, Skills: ${Array.isArray(j.skillsRequired) ? j.skillsRequired.join(', ') : j.skillsRequired})`).join("\n");

    const prompt = `You are SkillBridge's AI Career Coach & Skill Analyst.
Candidate Context:
- Name: ${user.name}
- Domain/Field: ${userField}
- Experience Level: ${user.experienceLevel || "Fresher"}
- Skills: ${userSkills.join(", ") || "React, JavaScript"}

Available Matching Jobs in Database:
${jobSummaries || "No direct matches found"}

User Question:
${lastMsg}

Provide a concise, highly actionable, encouraging response. Format key points with markdown bolding (**bold**).`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const reply = response.text.trim();
    res.status(200).json({ role: "assistant", content: reply });
  } catch (error) {
    console.error("AI Coach Error:", error);
    res.status(200).json({ role: "assistant", content: buildSmartFallbackReply() });
  }
});

/* ==========================
   UPDATE JOB
========================== */
const updateJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { title, role, company, location, salary, description, experienceRequired, skillsRequired } = req.body;

  if (title !== undefined && title.trim().length < 3) {
    res.status(400);
    throw new Error("Job title must be at least 3 characters");
  }
  if (salary !== undefined && Number(salary) < 0) {
    res.status(400);
    throw new Error("Salary must be a positive number");
  }
  if (description !== undefined && description.trim().length < 10) {
    res.status(400);
    throw new Error("Job description must be at least 10 characters");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.recruiter.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (role !== undefined) updateData.role = role;
  if (company !== undefined) updateData.company = company;
  if (location !== undefined) updateData.location = location;
  if (salary !== undefined) updateData.salary = salary;
  if (description !== undefined) updateData.description = description;
  if (experienceRequired !== undefined) updateData.experienceRequired = experienceRequired;
  if (skillsRequired !== undefined) updateData.skillsRequired = skillsRequired;

  const updatedJob = await Job.findByIdAndUpdate(jobId, updateData, {
    new: true,
  });

  await clearCache("/api/jobs");

  res
    .status(200)
    .json({ message: "Job updated successfully", job: updatedJob });
});

/* ==========================
   DELETE JOB
========================== */
const deleteJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.recruiter.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Access denied");
  }

  await Job.findByIdAndDelete(jobId);

  // FIX I-14: Cascade-delete all applications for this job to prevent orphaned records.
  // Previously only hiddenJobs/savedJobs were cleaned up, leaving Application records dangling.
  await Application.deleteMany({ job: jobId });
  await User.updateMany(
    {},
    { $pull: { hiddenJobs: jobId, savedJobs: jobId } }
  );

  res.status(200).json({ message: "Job deleted successfully" });
});

/* ==========================
   HIDE JOB (CANDIDATE)
========================== */
const hideJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const jobExists = await Job.exists({ _id: jobId });
  if (!jobExists) return res.status(404).json({ message: "Job not found" });

  if (!user.hiddenJobs.includes(jobId)) {
    user.hiddenJobs.push(jobId);
    await user.save();
  }

  res.status(200).json({ message: "Job hidden successfully" });
});

/* ==========================
   SEARCH MASTER SKILLS
========================== */
const searchMasterSkills = asyncHandler(async (req, res) => {
  const { query } = req.query;

  // Return empty array if query is missing or empty
  if (!query || query.trim() === "") {
    return res.status(200).json([]);
  }

  // Case-insensitive anchored regex search for fast performance
  const safeQuery = escapeRegex(query.trim());
  const skills = await MasterSkill.find({
    name: { $regex: `^${safeQuery}`, $options: "i" },
  }).limit(10);

  // Map to clean string array of skill names
  const skillNames = skills.map((skill) => skill.name);

  res.status(200).json(skillNames);
});

// --- Career OS: Manual Sync Endpoint ---
const triggerManualSync = async (req, res, next) => {
  try {
    const syncService = require("../services/sync.service");
    const jobAggConfig = require("../config/jobAggregation");

    if (!jobAggConfig.isAggregationEnabled) {
      return res.status(400).json({
        success: false,
        message: "Job Aggregation is disabled globally via configuration.",
      });
    }

    // Fire and forget - do not await
    syncService.runAllSync().catch(err => {
      console.error("[Manual Sync] Background sync failed:", err.message);
    });

    res.status(202).json({
      success: true,
      message: "Job Sync started in the background. Check logs or Admin Dashboard for status.",
    });
  } catch (error) {
    next(error);
  }
};

// --- Career OS: Health / Status Endpoint ---
const getSyncStatus = async (req, res, next) => {
  try {
    const jobAggConfig = require("../config/jobAggregation");
    const Provider = require("../models/Provider");

    const providers = await Provider.find({}).lean();
    
    const statusData = {
      engine: jobAggConfig.useNewSyncEngine ? "NEW" : "LEGACY",
      aggregationEnabled: jobAggConfig.isAggregationEnabled,
      dryRun: jobAggConfig.syncDryRun,
      providers: providers.map((p) => ({
        name: p.name,
        enabled: p.isEnabled,
        status: p.lastStatus,
        lastSync: p.lastSyncAt,
        lastError: p.lastError,
        jobsFetched: p.totalJobsFetched,
      }))
    };

    res.status(200).json(statusData);
  } catch (error) {
    next(error);
  }
};

const triggerScheduledSync = async (req, res, next) => {
  const providedSecret = req.headers["x-sync-secret"];

  if (!process.env.SYNC_SECRET_KEY || providedSecret !== process.env.SYNC_SECRET_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const syncService = require("../services/sync.service");
    const jobAggConfig = require("../config/jobAggregation");

    if (!jobAggConfig.isAggregationEnabled) {
      return res.status(400).json({
        success: false,
        message: "Job Aggregation is disabled globally via configuration.",
      });
    }

    console.log("[Scheduled Sync] Triggered via external cron at", new Date().toISOString());

    // Await this one (unlike the manual endpoint) so GitHub Actions gets a
    // real pass/fail result and logs, rather than firing-and-forgetting.
    const metrics = await syncService.runAllSync();

    res.status(200).json({
      success: true,
      message: "Job sync completed.",
      metrics,
    });
  } catch (error) {
    console.error("[Scheduled Sync] Failed:", error.message);
    res.status(500).json({ success: false, message: "Sync failed", error: error.message });
  }
};

/* ==========================
   ADMIN: GET ALL JOBS REGISTRY
========================== */
const getJobsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const { source, status, search } = req.query;

  const filter = {};
  if (source === "internal") filter.isExternal = { $ne: true };
  if (source === "external") filter.isExternal = true;

  // FIX I-02: Job schema has no 'status' field — it uses 'isActive' Boolean.
  // Previously using status:"open"/"closed" always returned 0.
  if (status === "active") filter.isActive = { $ne: false };
  if (status === "inactive") filter.isActive = false;

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { title: searchRegex },
      { company: searchRegex },
      { location: searchRegex }
    ];
  }

  // FIX I-02: Stats use isActive field, not status
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ isActive: { $ne: false } });
  const externalJobs = await Job.countDocuments({ isExternal: true });
  const internalJobs = await Job.countDocuments({ isExternal: { $ne: true } });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const jobsAddedToday = await Job.countDocuments({ createdAt: { $gte: today } });

  const stats = {
    total: totalJobs,
    active: activeJobs,
    external: externalJobs,
    internal: internalJobs,
    addedToday: jobsAddedToday
  };

  // Get paginated jobs
  const skip = (page - 1) * limit;
  let jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Aggregate application counts
  const jobIds = jobs.map(j => j._id);
  const applicationCounts = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$job", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  applicationCounts.forEach(item => {
    countMap[item._id.toString()] = item.count;
  });

  jobs = jobs.map(j => ({
    ...j,
    applicationCount: countMap[j._id.toString()] || 0
  }));

  const totalFiltered = await Job.countDocuments(filter);
  const totalPages = Math.ceil(totalFiltered / limit) || 1;

  res.status(200).json({
    jobs,
    stats,
    page,
    totalPages,
    totalJobs: totalFiltered
  });
});

module.exports = {
  getJobsAdmin,
  createJob,
  generateJobDescription,
  aiCareerCoach,
  getAllJobs,
  getRecruiterJobs,
  getRecommendedJobs,
  deleteJob,
  updateJob,
  hideJob,
  searchMasterSkills,
  triggerManualSync,
  triggerScheduledSync,
  getSyncStatus,
};
