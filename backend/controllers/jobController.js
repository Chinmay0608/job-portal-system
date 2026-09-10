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

  // 1. Detect candidate intent and tech/domain keywords dynamically
  //    Phase A: classify overall intent from natural language patterns
  const JOB_REQUEST_PATTERNS = /\b(find|show|recommend|suggest|get|list|give|look|search|identify|discover|explore|need|want|looking|help.*job|any.*job|new.*job|job.*opening|job.*opportunit|available.*job|job.*available|job.*near|job.*in|job.*for)\b/i;
  const isJobRequest = JOB_REQUEST_PATTERNS.test(lastMsg)
    || lastMsgLower.includes("job")
    || lastMsgLower.includes("opening")
    || lastMsgLower.includes("role")
    || lastMsgLower.includes("position")
    || lastMsgLower.includes("vacancy")
    || lastMsgLower.includes("opportunit")
    || lastMsgLower.includes("recruit")
    || lastMsgLower.includes("career");

  //    Phase B: extract the domain/tech keyword by removing request noise
  const extractSearchKeyword = (msg) => {
    // If the message is *only* generic job-request language with no domain keyword
    // (e.g. "can you help me identify a new job"), use the user's field rather than
    // returning a garbage keyword like "identify new"
    const lower = msg.toLowerCase();
    const stripped = lower
      .replace(/\b(i am looking for|looking for|i want|help me|can you help|find me|show me|give me|recommend|suggest|search for|search|what are the|are there any|can you find|list|tell me about|identify|discover|explore|any|please|could you|would you)\b/gi, " ")
      .replace(/\b(jobs?|openings?|roles?|vacanc(?:y|ies)|opportunities|positions?|careers?|listings?)\b/gi, " ")
      .replace(/\b(based on|related to|in|for|with|about|top|best|recent|latest|available|new|a|an|the|some|me|my|i)\b/gi, " ")
      .replace(/[^a-z0-9+#.\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Domain / tech keywords that are meaningful job search terms
    const TECH_KEYWORDS = /\b(react|node|python|java|javascript|typescript|angular|vue|flutter|kotlin|swift|golang|rust|c\+\+|c#|\.net|php|django|fastapi|spring|kubernetes|docker|aws|gcp|azure|devops|ml|ai|data|cloud|backend|frontend|fullstack|full.?stack|android|ios|mobile|embedded|blockchain|cybersecurity|security|qa|testing|sre|platform|infrastructure|database|sql|nosql|mongodb|postgres)\b/i;

    const techMatch = lastMsg.match(TECH_KEYWORDS);
    if (techMatch) return techMatch[0].toLowerCase();

    const stopWords = new Set(["my", "field", "me", "profile", "mine", "some", "any", "please", "the", "a", "an", "is", "it", "to", "do", "not", "be"]);
    const tokens = stripped.split(" ").filter((t) => t && t.length > 2 && !stopWords.has(t));

    // Only use the stripped keyword if it is clearly a meaningful domain/skill term
    // and not generic filler words left over from stripping
    const GENERIC_FILLER = /^(new|latest|recent|help|good|work|great|best|give|show|find|list|want|need|look|tell|know|can|get|make|take|have)$/i;
    const meaningfulTokens = tokens.filter(t => !GENERIC_FILLER.test(t));

    const cleaned = meaningfulTokens.join(" ");
    // Require at least 3 characters to avoid single-letter garbage
    if (cleaned.length >= 3) return cleaned;
    return "";
  };

  const searchKeyword = extractSearchKeyword(lastMsg);


  // 2. Query matching active jobs from Database with relevance ranking
  let matchedJobs = [];
  const jobQuery = { isActive: { $ne: false } };

  if (searchKeyword) {
    const tokens = searchKeyword.split(" ").filter((t) => t.length > 1);
    const tokenRegexes = tokens.map((t) => new RegExp(escapeRegex(t), "i"));
    const phraseRegex = new RegExp(escapeRegex(searchKeyword), "i");

    jobQuery.$or = [
      { title: phraseRegex },
      { skillsRequired: phraseRegex },
      { keywords: phraseRegex },
      { role: phraseRegex },
      { description: phraseRegex },
      {
        $and: tokens.map((t) => {
          const rx = new RegExp(escapeRegex(t), "i");
          return {
            $or: [{ title: rx }, { skillsRequired: rx }, { keywords: rx }, { role: rx }, { description: rx }],
          };
        }),
      },
      { title: { $in: tokenRegexes } },
      { skillsRequired: { $in: tokenRegexes } },
    ];
  } else if (userField) {
    const safeField = escapeRegex(userField);
    const skillRegexes = (userSkills || []).slice(0, 3).map((s) => new RegExp(escapeRegex(s), "i"));
    jobQuery.$or = [
      { role: { $regex: safeField, $options: "i" } },
      { title: { $regex: safeField, $options: "i" } },
      { keywords: { $regex: safeField, $options: "i" } },
      ...(skillRegexes.length > 0 ? [{ skillsRequired: { $in: skillRegexes } }] : []),
    ];
  }

  try {
    matchedJobs = await Job.find(jobQuery).limit(10).lean();
    // Rank jobs by relevance to search tokens if a specific keyword was searched
    if (searchKeyword && matchedJobs.length > 0) {
      const searchTokens = searchKeyword.toLowerCase().split(" ").filter((t) => t.length > 1);
      matchedJobs.sort((a, b) => {
        const aTitle = (a.title || "").toLowerCase();
        const bTitle = (b.title || "").toLowerCase();
        const aMatch = searchTokens.filter((t) => aTitle.includes(t)).length;
        const bMatch = searchTokens.filter((t) => bTitle.includes(t)).length;
        return bMatch - aMatch;
      });
    }
  } catch (e) {
    console.error("Error fetching jobs for AI coach:", e);
  }

  // Only use general fallback jobs if the user DID NOT ask for a specific searchKeyword
  // But if they asked for jobs generically, still load jobs from their field
  if (matchedJobs.length === 0) {
    try {
      if (isJobRequest && userField) {
        const safeField = escapeRegex(userField);
        const skillRegexes = (userSkills || []).slice(0, 3).map((s) => new RegExp(escapeRegex(s), "i"));
        matchedJobs = await Job.find({
          isActive: { $ne: false },
          $or: [
            { role: { $regex: safeField, $options: "i" } },
            { title: { $regex: safeField, $options: "i" } },
            { keywords: { $regex: safeField, $options: "i" } },
            ...(skillRegexes.length > 0 ? [{ skillsRequired: { $in: skillRegexes } }] : []),
          ]
        }).sort({ createdAt: -1 }).limit(5).lean();
      }
      // If still nothing, load any recent active jobs as a last resort
      if (matchedJobs.length === 0 && !searchKeyword) {
        matchedJobs = await Job.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).limit(5).lean();
      }
    } catch (e) {}
  }

  // 3. Build dynamic smart reply
  const buildSmartFallbackReply = () => {
    const cleanMsg = lastMsgLower.replace(/[^a-z0-9\s]/g, " ").trim();
    const rawName = (user?.name || "").trim();
    const displayName = rawName && rawName.toLowerCase() !== "user" ? rawName.split(" ")[0] : "there";

    // Priority 0: Warm, gentle greetings and pleasantries
    const isGreeting =
      /^(hey|hi|hello|greetings|good\s*(morning|afternoon|evening)|howdy|sup|yo|what\s*s\s*up)\b/i.test(cleanMsg) ||
      cleanMsg === "hey dhruv" ||
      cleanMsg === "hi dhruv" ||
      cleanMsg === "hello dhruv" ||
      cleanMsg === "dhruv" ||
      cleanMsg === "hey" ||
      cleanMsg === "hi" ||
      cleanMsg === "hello" ||
      cleanMsg.startsWith("how are you") ||
      cleanMsg.startsWith("how r u");

    if (isGreeting) {
      return `Hey **${displayName}**! 😊 It's wonderful to see you today. How are you doing?

I'm right here whenever you'd like to explore new career opportunities in **${userField}**, polish your skills, or prep for an interview. How can I help you today?`;
    }

    // Priority 1: Interview & Preparation Tips
    if (lastMsgLower.includes("interview") || lastMsgLower.includes("prep") || lastMsgLower.includes("tip")) {
      const topJob = matchedJobs[0];
      const jobTitle = topJob ? `**${topJob.title}** at **${topJob.company}**` : `your top **${userField}** matches`;
      const reqSkills = topJob && Array.isArray(topJob.skillsRequired) && topJob.skillsRequired.length > 0 
        ? topJob.skillsRequired.join(", ") 
        : (userSkills.join(", ") || "core technical stack");

      return `🎯 **Interview Preparation Tips for ${jobTitle}**:

• **Technical Focus**: Prepare to showcase hands-on experience with **${reqSkills}**. Practice explaining architectural choices and code trade-offs.
• **System & Problem Solving**: Review core data structures, algorithms, and domain design patterns for **${userField}** roles.
• **STAR Behavioral Method**: Structure past project experiences using Situation, Task, Action, and Result to demonstrate impact.
• **Company Insight**: Research ${topJob ? topJob.company : "the target company"}'s engineering culture and recent projects before your interview!`;
    }

    // Priority 2: Skill Gap Analysis
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

    // Priority 3: Job Listings & Recommendations
    if (isJobRequest) {
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
              skillsStr = searchKeyword || "Web & Modern Stack";
            }

            return `${i + 1}. **${j.title}** at **${j.company}**\n   📍 ${j.location || "Remote"} | ${salaryStr}\n   ⚡ Skills: ${skillsStr}`;
          })
          .join("\n\n");

        const categoryTitle = searchKeyword ? searchKeyword.toUpperCase() : userField.toUpperCase();
        return `Here are top active **${categoryTitle}** openings matching your request:

${jobListStr}

💡 **Career Tip**: Tailor your resume to emphasize experience in **${searchKeyword || userField}** to maximize your match score!`;
      } else if (searchKeyword) {
        return `I searched our database for **${searchKeyword}** roles, but there are no direct active openings listed right now.

💡 **Suggested Next Steps**:
• Try searching for related keywords like **Frontend**, **Full Stack**, or **JavaScript**.
• Set up a job alert for **${searchKeyword}** so you get notified as soon as new positions are posted!`;
      }
    }

    return `Hello **${displayName}**! 😊 I'm right here to support your career in **${userField}**.

Whenever you're ready, feel free to ask me to:
• **Search roles** (e.g. "show me ${userField} jobs")
• **Analyze your skill gaps** (e.g. "analyze my skills")
• **Interview prep** (e.g. "give me interview tips for ${userField}")`;
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

      const candidateDisplayName = (user?.name || "").trim().toLowerCase() !== "user" ? user.name.split(" ")[0] : "there";

      const targetSearch = searchKeyword || userField;

      const systemPrompt = `You are DHRUV, SkillBridge's universal voice assistant & AI career companion (like Siri / Alexa for professionals and job seekers).
Candidate Context:
- Name: ${candidateDisplayName === "there" ? "Candidate" : user.name}
- Target Domain: ${userField}
- Active Search Request: ${targetSearch}
- Experience Level: ${user.experienceLevel || "Fresher"}
- Skills: ${userSkills.join(", ") || "React, JavaScript"}

Available Matching Jobs in Database:
${jobSummaries || "No direct matches found"}

Tone & Personality:
- Warm, empathetic, encouraging, razor-sharp, natural, and conversational—like a brilliant, caring mentor (Siri/Alexa-style companion).
- Responses must be pleasant and punchy for both text and voice readback. Avoid endless filler or wall-of-text fatigue.

CAPABILITIES (YOU CAN HELP WITH ANY QUERY):
1. JOB SEARCH & MATCHING: When the candidate asks for jobs or roles in a specific area (e.g. "${targetSearch}"), recommend ONLY openings that strictly belong to that field. Never suggest unrelated positions (for instance, do NOT suggest SAS or network engineering when asked for web development).
2. CODING & TECHNICAL QUERIES: If the candidate asks coding, programming, architecture, or tech questions (e.g. React, Node, SQL, Python, DSA, System Design, Git, Docker): Provide clear, practical explanations, code snippets, and best practices.
3. INTERVIEW PREPARATION & BEHAVIORAL: Provide actionable tips, mock interview practice, STAR method answers, and advice on tough interview questions.
4. SALARY NEGOTIATION & RESUME: Help write or refine bullet points, suggest keywords, explain market compensation, and share negotiation tactics.
5. PLATFORM NAVIGATION: Guide them on SkillBridge features (e.g., "You can find your applied jobs under 'My Applications'", or "Check 'Salary Guide' in the menu to explore benchmarks").
6. GENERAL KNOWLEDGE & PRODUCTIVITY: Answer any questions accurately, cheerfully, and helpfully.

GREETING & CASUAL BEHAVIOR:
- When greeted ("Hey", "Hi", "Hey Dhruv", "Good morning", "How are you"), reply warmly and concisely (1-2 friendly sentences), greeting them by name (${candidateDisplayName === "there" ? "there" : candidateDisplayName}), and ask how you can help.

FORMATTING:
- Use clear markdown: bolding (**bold**), bullet points (•), and relevant emojis (💡, 🚀, 🎯, ⚡). Keep answers crisp and easy to scan or listen to.`;

      let reply = null;
      const modelsToTry = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"];

      for (const model of modelsToTry) {
        try {
          const groqRes = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model,
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

          reply = groqRes.data?.choices?.[0]?.message?.content?.trim();
          if (reply) break;
        } catch (modelErr) {
          console.warn(`Groq model ${model} failed, trying alternative:`, modelErr?.response?.data?.error?.message || modelErr.message);
        }
      }

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

    const prompt = `You are DHRUV, SkillBridge's friendly, warm, and supportive AI Career Coach & Skill Analyst.
Candidate Context:
- Name: ${user.name}
- Domain/Field: ${userField}
- Experience Level: ${user.experienceLevel || "Fresher"}
- Skills: ${userSkills.join(", ") || "React, JavaScript"}

Available Matching Jobs in Database:
${jobSummaries || "No direct matches found"}

User Message:
${lastMsg}

Instructions:
- If the user is simply greeting you (e.g., "Hey", "Hi", "Hey Dhruv", "Hello", "How are you"): Reply with a warm, gentle, and encouraging greeting addressing them by first name (${user.name.split(" ")[0] || "friend"}). Ask how you can support their career journey today. Do NOT dump large lists or bullet points on a greeting.
- If asking about jobs, skills, or interview tips: Provide concise, highly actionable, encouraging guidance. Format key points with markdown bolding (**bold**).`;

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
