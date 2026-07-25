const axios = require("axios");
const Job = require("../models/job");
const MasterSkill = require("../models/MasterSkill");
const { runGeminiScraper } = require("./geminiScraper");

// Helper to auto-add skills
const addSkillsToMaster = async (skills) => {
  for (const skill of skills) {
    if (!skill) continue;
    try {
      await MasterSkill.updateOne(
        { name: new RegExp(`^${skill}$`, "i") },
        { $setOnInsert: { name: skill } },
        { upsert: true }
      );
    } catch (err) {
      console.error(`[Job Fetcher] Failed to add MasterSkill ${skill}`);
    }
  }
};

const importJobsFromRemotive = async () => {
  console.log("[Job Fetcher] Starting Remotive API import...");
  try {
    const response = await axios.get("https://remotive.com/api/remote-jobs?category=software-dev");
    const externalJobs = response.data.jobs || [];
    if (externalJobs.length === 0) return 0;
    
    let newJobsCount = 0;
    for (const job of externalJobs) {
      const existingJob = await Job.findOne({ applyUrl: job.url });
      if (!existingJob) {
        const skillsRequired = job.tags && job.tags.length > 0 ? job.tags.slice(0, 5) : ["Software Development"];
        const newJobData = {
          title: job.title,
          role: "Software Developer",
          company: job.company_name,
          location: job.candidate_required_location || "Remote",
          salary: job.salary || "Competitive",
          description: job.description,
          skillsRequired,
          educationRequired: "Not Specified",
          experienceRequired: "Fresher",
          applyUrl: job.url,
          isExternal: true,
          companyLogo: job.company_logo || "",
        };
        await Job.create(newJobData);
        newJobsCount++;
        await addSkillsToMaster(skillsRequired);
      }
    }
    console.log(`[Job Fetcher] Remotive added ${newJobsCount} jobs.`);
    return newJobsCount;
  } catch (error) {
    console.error("[Job Fetcher] Remotive error:", error.message);
    return 0;
  }
};

const importJobsFromTheMuse = async () => {
  console.log("[Job Fetcher] Starting The Muse API import...");
  try {
    // page 1 of the muse api
    const response = await axios.get("https://www.themuse.com/api/public/jobs?page=1");
    const externalJobs = response.data.results || [];
    if (externalJobs.length === 0) return 0;

    let newJobsCount = 0;
    for (const job of externalJobs) {
      const applyUrl = job.refs && job.refs.landing_page ? job.refs.landing_page : null;
      if (!applyUrl) continue;

      const existingJob = await Job.findOne({ applyUrl });
      if (!existingJob) {
        const location = job.locations && job.locations.length > 0 ? job.locations[0].name : "Remote";
        const role = job.categories && job.categories.length > 0 ? job.categories[0].name : "General";
        
        // Extracted basic skills from categories and levels
        const rawSkills = [];
        if (job.categories) job.categories.forEach(c => rawSkills.push(c.name));
        if (job.levels) job.levels.forEach(l => rawSkills.push(l.name));
        if (rawSkills.length === 0) rawSkills.push("Communication");

        const newJobData = {
          title: job.name,
          role: role,
          company: job.company && job.company.name ? job.company.name : "Unknown",
          location: location,
          salary: "Competitive", // The Muse rarely provides salary in basic payload
          description: job.contents || "No description available",
          skillsRequired: rawSkills.slice(0, 5),
          educationRequired: "Not Specified",
          experienceRequired: "Fresher",
          applyUrl: applyUrl,
          isExternal: true,
          companyLogo: "",
        };
        await Job.create(newJobData);
        newJobsCount++;
        await addSkillsToMaster(newJobData.skillsRequired);
      }
    }
    console.log(`[Job Fetcher] The Muse added ${newJobsCount} jobs.`);
    return newJobsCount;
  } catch (error) {
    console.error("[Job Fetcher] The Muse error:", error.message);
    return 0;
  }
};

const importJobsFromArbeitnow = async () => {
  console.log("[Job Fetcher] Starting Arbeitnow API import...");
  try {
    const response = await axios.get("https://www.arbeitnow.com/api/job-board-api");
    const externalJobs = response.data.data || [];
    if (externalJobs.length === 0) return 0;

    let newJobsCount = 0;
    for (const job of externalJobs) {
      const applyUrl = job.url;
      if (!applyUrl) continue;

      const existingJob = await Job.findOne({ applyUrl });
      if (!existingJob) {
        const skillsRequired = job.tags && job.tags.length > 0 ? job.tags.slice(0, 5) : ["Technology"];
        const newJobData = {
          title: job.title,
          role: job.job_types && job.job_types.length > 0 ? job.job_types[0] : "Professional",
          company: job.company_name || "Unknown",
          location: job.location || "Remote",
          salary: "Competitive", 
          description: job.description || "No description available",
          skillsRequired: skillsRequired,
          educationRequired: "Not Specified",
          experienceRequired: "Fresher",
          applyUrl: applyUrl,
          isExternal: true,
          companyLogo: "",
        };
        await Job.create(newJobData);
        newJobsCount++;
        await addSkillsToMaster(skillsRequired);
      }
    }
    console.log(`[Job Fetcher] Arbeitnow added ${newJobsCount} jobs.`);
    return newJobsCount;
  } catch (error) {
    console.error("[Job Fetcher] Arbeitnow error:", error.message);
    return 0;
  }
};

const importAllExternalJobs = async () => {
  console.log("[Job Fetcher] Starting unified external job fetcher...");
  let total = 0;
  total += await importJobsFromRemotive();
  total += await importJobsFromTheMuse();
  total += await importJobsFromArbeitnow();
  
  if (process.env.GEMINI_API_KEY) {
    total += await runGeminiScraper();
  } else {
    console.log("[Job Fetcher] Skipping Gemini scraper (No GEMINI_API_KEY).");
  }

  console.log(`[Job Fetcher] Unified fetch complete. Added ${total} total new jobs across all APIs.`);
};

module.exports = {
  importJobsFromRemotive,
  importJobsFromTheMuse,
  importJobsFromArbeitnow,
  importAllExternalJobs
};
