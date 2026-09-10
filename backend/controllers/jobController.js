const Job = require("../models/job");
const User = require("../models/user");
const Application = require("../models/Application"); // FIX I-03: Correct casing (Linux FS is case-sensitive)
const MasterSkill = require("../models/MasterSkill");
const { calculateJobMatches, FIELD_KEYWORDS } = require("../services/jobMatchService");
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
    field,
    domain,
    page = 1,
    limit = 20,
  } = req.query;

  const query = getBaseActiveJobQuery();

  let candidateUser = null;
  if (req.user) {
    candidateUser = await User.findById(req.user.id);
    if (candidateUser && candidateUser.hiddenJobs && candidateUser.hiddenJobs.length > 0) {
      query._id = { $nin: candidateUser.hiddenJobs };
    }
  }

  // Domain / Field filter: prioritize candidate's field if browsing without explicit search
  const candidateField = field || domain || (candidateUser?.role === "candidate" ? candidateUser?.field : null);
  if (candidateField && !search && candidateField !== "All") {
    const fieldLower = candidateField.toLowerCase();
    const keywords = FIELD_KEYWORDS[fieldLower] || [fieldLower];
    const fieldRegex = new RegExp(keywords.map((k) => `\\b${escapeRegex(k)}\\b`).join("|"), "i");
    const domainCondition = {
      $or: [
        { title: { $regex: fieldRegex } },
        { keywords: { $regex: fieldRegex } },
        { role: { $regex: fieldRegex } },
      ],
    };

    if (query.$and) {
      query.$and.push(domainCondition);
    } else if (query.$or) {
      query.$and = [domainCondition, { $or: query.$or }];
      delete query.$or;
    } else {
      query.$or = domainCondition.$or;
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
    // FIX I-13: Use case-insensitive comparison â€” frontend sends "internal" (lowercase)
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
   AI CAREER COACH ASSISTANT  (RAG-grounded)
========================== */
const aiCareerCoach = asyncHandler(async (req, res) => {
  const { messages } = req.body;

  // â”€â”€ 1. Fetch full candidate profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const user = await User.findById(req.user.id)
    .select("name skills field experienceLevel education highestQualification designation about location")
    .lean();

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const lastMsg  = (messages?.[messages.length - 1]?.content || "").trim();
  const lastMsgLower = lastMsg.toLowerCase();
  const userSkills   = Array.isArray(user.skills) ? user.skills : [];
  const userField    = user.field || "Software Engineering";
  const displayName  = (user.name || "").trim().toLowerCase() !== "user" && user.name
    ? user.name.split(" ")[0]
    : "there";

  // â”€â”€ 2. Intent classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const JOB_REQUEST_PATTERNS = /\b(find|show|recommend|suggest|get|list|give|look|search|identify|discover|explore|need|want|looking|help.*job|any.*job|new.*job|job.*opening|job.*opportunit|available.*job|job.*available|job.*near|job.*in|job.*for|fit.*profile|suit.*profile|match.*profile|roles.*for)\b/i;
  const isJobRequest = JOB_REQUEST_PATTERNS.test(lastMsg)
    || lastMsgLower.includes("job")
    || lastMsgLower.includes("opening")
    || lastMsgLower.includes("role")
    || lastMsgLower.includes("position")
    || lastMsgLower.includes("vacancy")
    || lastMsgLower.includes("opportunit")
    || lastMsgLower.includes("recruit")
    || lastMsgLower.includes("career")
    || lastMsgLower.includes("fit my profile")
    || lastMsgLower.includes("suit my profile");

  // â”€â”€ 3. Extract domain keyword from message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const extractSearchKeyword = (msg) => {
    const lower = msg.toLowerCase();
    const TECH_KEYWORDS = /\b(react|node|python|java|javascript|typescript|angular|vue|flutter|kotlin|swift|golang|rust|c\+\+|c#|\.net|php|django|fastapi|spring|kubernetes|docker|aws|gcp|azure|devops|ml|ai|data|cloud|backend|frontend|fullstack|full.?stack|android|ios|mobile|embedded|blockchain|cybersecurity|security|qa|testing|sre|platform|infrastructure|database|sql|nosql|mongodb|postgres)\b/i;
    const techMatch = msg.match(TECH_KEYWORDS);
    if (techMatch) return techMatch[0].toLowerCase();

    const stripped = lower
      .replace(/\b(i am looking for|looking for|i want|help me|can you help|find me|show me|give me|recommend|suggest|search for|search|what are the|are there any|can you find|list|tell me about|identify|discover|explore|any|please|could you|would you|roles|fit|match|suit|profile)\b/gi, " ")
      .replace(/\b(jobs?|openings?|roles?|vacanc(?:y|ies)|opportunities|positions?|careers?|listings?)\b/gi, " ")
      .replace(/\b(based on|related to|in|for|with|about|top|best|recent|latest|available|new|a|an|the|some|me|my|i)\b/gi, " ")
      .replace(/[^a-z0-9+#.\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const stopWords = new Set(["my", "field", "me", "profile", "mine", "some", "any", "please", "the", "a", "an", "is", "it", "to", "do", "not", "be"]);
    const GENERIC_FILLER = /^(new|latest|recent|help|good|work|great|best|give|show|find|list|want|need|look|tell|know|can|get|make|take|have)$/i;
    const tokens = stripped.split(" ").filter((t) => t && t.length > 2 && !stopWords.has(t) && !GENERIC_FILLER.test(t));
    const cleaned = tokens.join(" ");
    return cleaned.length >= 3 ? cleaned : "";
  };

  const searchKeyword = extractSearchKeyword(lastMsg);

  // â”€â”€ 4. RAG: retrieve up to 5 grounded active jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let matchedJobs = [];
  const jobSelectFields = "title company location salary experienceLevel skillsRequired applyLink isExternal";

  const buildFieldQuery = () => {
    const safeField = escapeRegex(userField);
    const skillRegexes = userSkills.slice(0, 5).map((s) => new RegExp(escapeRegex(s), "i"));
    return {
      isActive: { $ne: false },
      $or: [
        { role:           { $regex: safeField, $options: "i" } },
        { title:          { $regex: safeField, $options: "i" } },
        { keywords:       { $regex: safeField, $options: "i" } },
        ...(skillRegexes.length > 0 ? [{ skillsRequired: { $in: skillRegexes } }] : []),
      ],
    };
  };

  try {
    if (searchKeyword) {
      const tokens       = searchKeyword.split(" ").filter((t) => t.length > 1);
      const tokenRegexes = tokens.map((t) => new RegExp(escapeRegex(t), "i"));
      const phraseRegex  = new RegExp(escapeRegex(searchKeyword), "i");

      matchedJobs = await Job.find({
        isActive: { $ne: false },
        $or: [
          { title:          phraseRegex },
          { skillsRequired: phraseRegex },
          { keywords:       phraseRegex },
          { role:           phraseRegex },
          { description:    phraseRegex },
          { title:          { $in: tokenRegexes } },
          { skillsRequired: { $in: tokenRegexes } },
        ],
      })
        .select(jobSelectFields)
        .limit(5)
        .lean();

      // Rank by title relevance
      if (matchedJobs.length > 0) {
        const searchTokens = searchKeyword.toLowerCase().split(" ").filter((t) => t.length > 1);
        matchedJobs.sort((a, b) => {
          const aScore = searchTokens.filter((t) => (a.title || "").toLowerCase().includes(t)).length;
          const bScore = searchTokens.filter((t) => (b.title || "").toLowerCase().includes(t)).length;
          return bScore - aScore;
        });
      }
    }

    // Fall back to user's field + skills if no keyword match or empty result
    if (matchedJobs.length === 0) {
      matchedJobs = await Job.find(buildFieldQuery())
        .select(jobSelectFields)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    // Last resort: any recent active jobs
    if (matchedJobs.length === 0 && !searchKeyword) {
      matchedJobs = await Job.find({ isActive: { $ne: false } })
        .select(jobSelectFields)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }
  } catch (e) {
    console.error("[aiCareerCoach] Job query error:", e.message);
  }

  // â”€â”€ 5. Build job summaries string for context injection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const formatJobSummary = (j) => {
    const salaryStr = j.salary && Number(j.salary) > 0
      ? `$${Number(j.salary).toLocaleString()}`
      : "Competitive";
    const skills = Array.isArray(j.skillsRequired) && j.skillsRequired.length > 0
      ? j.skillsRequired.join(", ")
      : (typeof j.skillsRequired === "string" ? j.skillsRequired : "Domain skills");
    return `- ${j.title} at ${j.company} | ${j.location || "Remote"} | ${salaryStr} | Skills: ${skills}`;
  };

  const jobSummariesText = matchedJobs.length > 0
    ? matchedJobs.map(formatJobSummary).join("\n")
    : null;

  // â”€â”€ 6. Assemble rich candidate context block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const educationStr = Array.isArray(user.education) && user.education.length > 0
    ? user.education.map((e) => `${e.degree || ""} from ${e.institution || ""}`.trim()).filter(Boolean).join("; ")
    : user.highestQualification || "Not specified";

  const candidateContextBlock = `
Candidate Profile:
- Name: ${user.name || "Guest Candidate"}
- Current Role / Designation: ${user.designation || "Not specified"}
- Location: ${user.location || "Not specified"}
- Field / Target Domain: ${userField}
- Experience Level: ${user.experienceLevel || "Not specified"}
- Skills: ${userSkills.join(", ") || "Not specified"}
- Education: ${educationStr}
- About: ${user.about ? user.about.slice(0, 200) : "Not provided"}`.trim();

  const jobsContextBlock = jobSummariesText
    ? `\nActive SkillBridge Jobs Matching This Candidate (ground your recommendations ONLY in these real listings):\n${jobSummariesText}`
    : `\nNo active jobs currently match this candidate's profile. Acknowledge this honestly â€” do NOT invent or hallucinate job listings.`;

  // â”€â”€ 7. Build system instruction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const systemInstruction = `You are DHRUV, SkillBridge's empathetic, data-driven AI Career Coach and Job Search Assistant.

${candidateContextBlock}
${jobsContextBlock}

Operational Directives:
1. When the candidate asks for job recommendations, cite ONLY the real platform jobs listed above. Never hallucinate, invent, or describe jobs not present in the list. If no jobs are listed, say so honestly and suggest they refine their profile or check back soon.
2. Be candid about skill gaps without discouraging â€” name the delta and suggest a concrete action.
3. Keep responses clean of markdown tables, raw HTML, or heavily nested formatting so the voice readback sounds natural.
4. Greet warmly but briefly. Do not dump job lists on a greeting message.
5. For coding or technical questions not related to job search, answer accurately and helpfully.`;

  // â”€â”€ 8. Try Groq (llama-3.3-70b) first â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && groqApiKey.startsWith("gsk_")) {
    try {
      const axios = require("axios");
      const modelsToTry = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"];
      let reply = null;

      for (const model of modelsToTry) {
        try {
          const groqRes = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model,
              messages: [
                { role: "system", content: systemInstruction },
                ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
              ],
              temperature: 0.65,
              max_tokens: 1024,
            },
            {
              headers: {
                Authorization: `Bearer ${groqApiKey}`,
                "Content-Type": "application/json",
              },
              timeout: 12000,
            }
          );
          reply = groqRes.data?.choices?.[0]?.message?.content?.trim();
          if (reply) break;
        } catch (modelErr) {
          console.warn(`[aiCareerCoach] Groq model ${model} failed:`, modelErr?.response?.data?.error?.message || modelErr.message);
        }
      }

      if (reply) return res.status(200).json({ role: "assistant", content: reply });
    } catch (error) {
      console.error("[aiCareerCoach] Groq error:", error?.response?.data || error.message);
    }
  }

  // â”€â”€ 9. Gemini 2.0 Flash fallback (with 20-second timeout) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("AQ.")) {
    return res.status(200).json({ role: "assistant", content: buildSmartFallbackReply() });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const geminiCall = ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: messages.slice(-6).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      systemInstruction: { role: "user", parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 1024,
      },
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini timed out after 20s")), 20000)
    );

    const response = await Promise.race([geminiCall, timeout]);
    const reply = response.text?.trim();
    if (!reply) throw new Error("Gemini returned empty response");

    return res.status(200).json({ role: "assistant", content: reply });
  } catch (error) {
    console.error("[aiCareerCoach] Gemini error:", error?.message || error);
    return res.status(200).json({ role: "assistant", content: buildSmartFallbackReply() });
  }

  // â”€â”€ 10. Smart local fallback (no AI available) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildSmartFallbackReply() {
    const isGreeting =
      /^(hey|hi|hello|greetings|good\s*(morning|afternoon|evening)|howdy|sup|yo)$/i.test(lastMsgLower.trim()) ||
      ["hey dhruv", "hi dhruv", "hello dhruv", "dhruv", "how are you", "how r u"].some((g) => lastMsgLower.startsWith(g));

    if (isGreeting) {
      return `Hey ${displayName}! Great to see you. I'm DHRUV, your SkillBridge career coach. I'm here to help you find ${userField} roles, analyze your skills, or prep for interviews. What can I help you with today?`;
    }

    if (lastMsgLower.includes("interview") || lastMsgLower.includes("prep") || lastMsgLower.includes("tip")) {
      const topJob = matchedJobs[0];
      const reqSkills = topJob && Array.isArray(topJob.skillsRequired) && topJob.skillsRequired.length > 0
        ? topJob.skillsRequired.join(", ")
        : (userSkills.join(", ") || "your core tech stack");
      return `Here are targeted interview tips for ${userField} roles.\n\nTechnical Focus: Prepare to demonstrate hands-on experience with ${reqSkills}.\n\nSystem Design: Practice explaining architectural decisions and trade-offs clearly.\n\nBehavioral: Use the STAR method â€” Situation, Task, Action, Result â€” for every competency question.\n\nResearch: Before any interview, review the company's engineering blog and recent product updates.\n\nGood luck â€” you've got this!`;
    }

    if (lastMsgLower.includes("skill gap") || lastMsgLower.includes("gap") || lastMsgLower.includes("analyze")) {
      const allRequired = new Set();
      matchedJobs.forEach((j) => {
        const skills = Array.isArray(j.skillsRequired) ? j.skillsRequired : (j.skillsRequired || "").split(",");
        skills.forEach((s) => s && allRequired.add(s.trim()));
      });
      const userSkillSet = new Set(userSkills.map((s) => s.toLowerCase()));
      const missing = Array.from(allRequired).filter((s) => s && !userSkillSet.has(s.toLowerCase())).slice(0, 5);
      return `Skill Gap Analysis for ${user.name} in ${userField}.\n\nYour current skills: ${userSkills.join(", ") || "none listed yet"}.\n\nIn-demand skills from active listings: ${missing.join(", ") || "Docker, AWS, System Design"}.\n\nAdding two or three of these to your profile can meaningfully improve your match score with open roles.`;
    }

    if (isJobRequest) {
      if (matchedJobs.length > 0) {
        const jobList = matchedJobs.slice(0, 3).map((j, i) => {
          const salary = j.salary && Number(j.salary) > 0 ? `$${Number(j.salary).toLocaleString()}` : "Competitive Salary";
          const skills = Array.isArray(j.skillsRequired) ? j.skillsRequired.join(", ") : (j.skillsRequired || searchKeyword || userField);
          return `${i + 1}. ${j.title} at ${j.company} â€” ${j.location || "Remote"} â€” ${salary} â€” Skills: ${skills}`;
        }).join("\n");
        return `Here are active ${searchKeyword ? searchKeyword.toUpperCase() : userField.toUpperCase()} openings on SkillBridge right now:\n\n${jobList}\n\nApply directly from the Jobs tab. Tailor your resume to highlight the required skills for the best match rate.`;
      }
      if (searchKeyword) {
        return `I searched our active listings for ${searchKeyword} roles but found nothing listed right now. Try broadening your search with related terms, or check back soon as new jobs are posted daily.`;
      }
    }

    return `Hey ${displayName}! I'm right here to support your ${userField} career journey. You can ask me to find open roles, analyze your skill gaps, or help you prep for an interview. What would you like to tackle?`;
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
    returnDocument: "after",
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

  const rawQuery = query.trim();
  const safeQuery = escapeRegex(rawQuery);
  const queryLower = rawQuery.toLowerCase();

  // Find matching skills (prefix or substring/word-boundary)
  const skills = await MasterSkill.find({
    name: { $regex: safeQuery, $options: "i" },
  })
    .limit(30)
    .lean();

  // Rank prefix matches first, then word-boundary matches, then shorter length
  skills.sort((a, b) => {
    const aLower = a.name.toLowerCase();
    const bLower = b.name.toLowerCase();
    const aStarts = aLower.startsWith(queryLower);
    const bStarts = bLower.startsWith(queryLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    const aWord = aLower.includes(" " + queryLower) || aLower.includes("(" + queryLower);
    const bWord = bLower.includes(" " + queryLower) || bLower.includes("(" + queryLower);
    if (aWord && !bWord) return -1;
    if (!aWord && bWord) return 1;

    return a.name.length - b.name.length;
  });

  // Map to clean string array of top 10 unique skill names
  const skillNames = Array.from(new Set(skills.map((skill) => skill.name))).slice(0, 10);

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

  // FIX I-02: Job schema has no 'status' field â€” it uses 'isActive' Boolean.
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
