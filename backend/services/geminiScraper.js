const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenAI } = require("@google/genai");
const Job = require("../models/job");
const MasterSkill = require("../models/MasterSkill");

// We will initialize it lazily inside the function

const extractExperience = (title) => {
  const t = title.toLowerCase();
  if (t.includes("senior") || t.includes("lead") || t.includes("director") || t.includes("principal") || t.includes("manager") || t.includes("head")) return "5+ Years";
  if (t.includes("mid") || t.includes("intermediate") || t.includes("experienced")) return "2-5 Years";
  if (t.includes("junior") || t.includes("associate") || t.includes("entry")) return "0-2 Years";
  return "Fresher";
};

// A curated list of ATS boards that are easily scrapable (no heavy JS blocking)
const TARGET_COMPANIES = [
  { name: "Stripe", url: "https://boards.greenhouse.io/stripe" },
  { name: "Vercel", url: "https://boards.greenhouse.io/vercel" },
  { name: "Discord", url: "https://boards.greenhouse.io/discord" }
];

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
      console.error(`[Gemini Scraper] Failed to add MasterSkill ${skill}`);
    }
  }
};

const scrapeCareersPage = async (company) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[Gemini Scraper] GEMINI_API_KEY missing. Skipping.");
    return 0;
  }

  // Lazy Initialization
  let ai;
  try {
    ai = new GoogleGenAI({ apiKey: apiKey });
  } catch (e) {
    console.log("[Gemini Scraper] Gemini SDK failed to initialize with the provided key.");
    return 0;
  }

  console.log(`[Gemini Scraper] Fetching career page for ${company.name}...`);
  try {
    const { data: html } = await axios.get(company.url);
    
    // Load HTML into cheerio and extract raw text (stripping scripts/styles)
    const $ = cheerio.load(html);
    $('script, style, noscript, iframe, img, svg').remove();
    let rawText = $('body').text().replace(/\s+/g, ' ').trim();

    // To save tokens, we only take the first ~25,000 characters
    rawText = rawText.substring(0, 25000);

    const prompt = `
      You are an expert technical recruiter AI.
      I am providing you with the raw scraped text from the careers page of ${company.name}.
      Please extract all software engineering, data, and design jobs.
      For each job, extract its exact Title, Location, required Skills (make educated guesses if not explicitly stated, e.g. "React" for Frontend), the Application URL, and a brief 2-3 sentence description of the role.
      Make sure the Application URL is a valid absolute URL. If it is relative, prepend it with the base URL. (Base URL is likely the domain of ${company.url})
      
      Here is the raw text:
      ${rawText}
    `;

    const responseSchema = {
      type: "ARRAY",
      description: "List of job postings",
      items: {
          type: "OBJECT",
          properties: {
              title: { type: "STRING" },
              location: { type: "STRING" },
              skillsRequired: { type: "ARRAY", items: { type: "STRING" } },
              applyUrl: { type: "STRING" },
              role: { type: "STRING" },
              description: { type: "STRING" }
          },
          required: ["title", "location", "skillsRequired", "applyUrl", "role", "description"]
      }
    };

    console.log(`[Gemini Scraper] Sending data to Gemini 2.5 Flash for ${company.name}...`);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    const jobsJson = JSON.parse(response.text);
    
    if (!jobsJson || jobsJson.length === 0) {
      console.log(`[Gemini Scraper] Gemini found no relevant jobs for ${company.name}.`);
      return 0;
    }

    let insertedCount = 0;
    for (const job of jobsJson) {
      if (!job.applyUrl) continue;
      
      // Ensure absolute URL
      let finalUrl = job.applyUrl;
      if (finalUrl.startsWith("/")) {
        const urlObj = new URL(company.url);
        finalUrl = `${urlObj.protocol}//${urlObj.host}${finalUrl}`;
      }

      const existingJob = await Job.findOne({ applyUrl: finalUrl });
      if (!existingJob) {
        const newJob = {
          title: job.title,
          role: job.role || "Software Developer",
          company: company.name,
          location: job.location || "Remote",
          salary: "Competitive",
          description: job.description || `Extracted via Gemini AI from ${company.name} careers page.`,
          skillsRequired: job.skillsRequired.slice(0, 5),
          educationRequired: "Not Specified",
          experienceRequired: extractExperience(job.title),
          applyUrl: finalUrl,
          isExternal: true,
          companyLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=random`
        };
        await Job.create(newJob);
        await addSkillsToMaster(newJob.skillsRequired);
        insertedCount++;
      }
    }
    
    console.log(`[Gemini Scraper] Successfully added ${insertedCount} jobs for ${company.name}.`);
    return insertedCount;

  } catch (error) {
    console.error(`[Gemini Scraper] Error scraping ${company.name}:`, error.message);
    return 0;
  }
};

const runGeminiScraper = async () => {
  console.log("[Gemini Scraper] Starting intelligent web scraper...");
  let totalJobs = 0;
  for (const company of TARGET_COMPANIES) {
    totalJobs += await scrapeCareersPage(company);
  }
  console.log(`[Gemini Scraper] Finished. Extracted ${totalJobs} new jobs using Gemini!`);
  return totalJobs;
};

module.exports = { runGeminiScraper };
