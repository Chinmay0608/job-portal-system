const axios = require("axios");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Job = require("../models/job");

const TARGET_GOAL = 15000;

function classifyDomain(title = "", dept = "", desc = "") {
  const text = `${title} ${dept} ${desc}`.toLowerCase();
  if (/(data|analytics|machine learning|deep learning|bi engineer|data scientist|data analyst)/.test(text)) return "Data & Analytics";
  if (/(product manager|product designer|ux|ui|graphic design|creative director|design system)/.test(text)) return "Product & Design";
  if (/(marketing|growth|seo|content|social media|brand|communications|pr manager)/.test(text)) return "Marketing & Growth";
  if (/(sales|account executive|business development|bdr|sdr|account manager|partnerships)/.test(text)) return "Sales & Business Dev";
  if (/(finance|accounting|accountant|payroll|tax|treasury|controller|billing|legal|counsel)/.test(text)) return "Finance & Accounting";
  if (/(recruiter|recruiting|talent|people ops|human resources|hr |culture|people partner)/.test(text)) return "HR & Talent";
  if (/(customer support|customer success|client support|technical support|help desk|service)/.test(text)) return "Customer Support";
  if (/(operations|supply chain|logistics|procurement|facilities|strategy & ops|chief of staff)/.test(text)) return "Operations & Logistics";
  if (/(health|clinical|medical|nurse|patient|wellness|biotech|pharma)/.test(text)) return "Healthcare & General";
  if (/(software|developer|frontend|backend|full stack|devops|cloud|sre|security|engineer|qa|ios|android|architect|infra)/.test(text)) return "Software & Tech";
  return "Software & Tech";
}

function inferExperience(title = "", desc = "") {
  const text = `${title} ${desc}`.toLowerCase();
  if (/(senior|lead|principal|staff|director|head of|vp|architect)/.test(text)) return "5+ Years";
  if (/(mid|intermediate|experienced|specialist|consultant)/.test(text)) return "2-5 Years";
  if (/(junior|entry|associate|graduate|intern|trainee|apprentice|fresher)/.test(text)) return "0-2 Years";
  return "0-2 Years";
}

async function saveBatch(jobs) {
  if (!jobs || jobs.length === 0) return 0;
  const ops = jobs.map(j => {
    const domain = classifyDomain(j.title, j.category, j.description);
    const exp = inferExperience(j.title, j.description);
    return {
      updateOne: {
        filter: { applyUrl: j.applyUrl },
        update: {
          $set: {
            title: j.title,
            role: domain,
            company: j.company,
            location: j.location || "Remote",
            salary: j.salary || "Competitive",
            applyUrl: j.applyUrl,
            isExternal: true,
            isActive: true,
            description: j.description || `${j.company} is hiring for ${j.title}.`,
            skillsRequired: j.skillsRequired || [domain],
            experienceRequired: exp,
            source: j.provider || "Enterprise ATS",
            isRemote: j.isRemote !== undefined ? j.isRemote : true,
            keywords: [domain, j.company, ...(j.skillsRequired || [])],
            providerMetadata: { domain, provider: j.provider || "Enterprise ATS" },
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        upsert: true
      }
    };
  });

  try {
    const res = await Job.bulkWrite(ops, { ordered: false });
    return (res.upsertedCount || 0) + (res.modifiedCount || 0);
  } catch (err) {
    return 0;
  }
}

const TOP_BOARDS = [
  // Greenhouse high volume boards
  { type: "gh", company: "Canonical", token: "canonical" },
  { type: "gh", company: "GitHub", token: "github" },
  { type: "gh", company: "Uber", token: "uber" },
  { type: "gh", company: "Databricks", token: "databricks" },
  { type: "gh", company: "Snowflake", token: "snowflake" },
  { type: "gh", company: "Elastic", token: "elastic" },
  { type: "gh", company: "Cloudflare", token: "cloudflare" },
  { type: "gh", company: "Atlassian", token: "atlassian" },
  { type: "gh", company: "Shopify", token: "shopify" },
  { type: "gh", company: "Automattic", token: "automattic" },
  { type: "gh", company: "HubSpot", token: "hubspot" },
  { type: "gh", company: "Confluent", token: "confluent" },
  { type: "gh", company: "Discord", token: "discord" },
  { type: "gh", company: "Canva", token: "canva" },
  { type: "gh", company: "Miro", token: "miro" },
  { type: "gh", company: "Box", token: "box" },
  { type: "gh", company: "Docker", token: "docker" },
  { type: "gh", company: "Zapier", token: "zapier" },
  { type: "gh", company: "Postman", token: "postman" },
  { type: "gh", company: "Kraken", token: "kraken" },

  // Ashby high growth boards
  { type: "ashby", company: "Anthropic", token: "anthropic" },
  { type: "ashby", company: "Vercel", token: "vercel" },
  { type: "ashby", company: "Supabase", token: "supabase" },
  { type: "ashby", company: "Retool", token: "retool" },
  { type: "ashby", company: "ElevenLabs", token: "elevenlabs" },
  { type: "ashby", company: "Mistral AI", token: "mistral" },
  { type: "ashby", company: "Glean", token: "glean" },
  { type: "ashby", company: "Runway", token: "runwayml" },
  { type: "ashby", company: "Replit", token: "replit" },
  { type: "ashby", company: "Cursor", token: "anysphere" },

  // Lever high volume boards
  { type: "lever", company: "Netflix", token: "netflix" },
  { type: "lever", company: "Plaid", token: "plaid" },
  { type: "lever", company: "Eventbrite", token: "eventbrite" },
  { type: "lever", company: "Coupa", token: "coupa" },
  { type: "lever", company: "Yelp", token: "yelp" }
];

async function run() {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);

  let current = await Job.countDocuments();
  console.log(`Current Total in MongoDB: ${current}`);

  if (current >= TARGET_GOAL) {
    console.log(`Already reached goal of ${TARGET_GOAL}+ jobs! Current: ${current}`);
    process.exit(0);
  }

  console.log(`Target: ${TARGET_GOAL}. Need ~${TARGET_GOAL - current} more jobs. Fetching top enterprise boards...`);

  for (const b of TOP_BOARDS) {
    try {
      let formatted = [];
      if (b.type === "gh") {
        const url = `https://boards-api.greenhouse.io/v1/boards/${b.token}/jobs?content=true`;
        const resp = await axios.get(url, { timeout: 12000 });
        const jobs = resp.data && resp.data.jobs ? resp.data.jobs : [];
        formatted = jobs.map(j => ({
          title: j.title,
          company: b.company,
          location: j.location ? j.location.name : "Remote",
          salary: "Competitive",
          applyUrl: j.absolute_url,
          description: j.content ? j.content.replace(/<[^>]*>?/gm, "").slice(0, 1500) : `${b.company} is hiring for ${j.title}.`,
          skillsRequired: (j.departments || []).map(d => d.name),
          category: (j.departments && j.departments[0]) ? j.departments[0].name : "Tech",
          provider: "Greenhouse"
        }));
      } else if (b.type === "ashby") {
        const url = `https://api.ashbyhq.com/posting-api/job-board/${b.token}`;
        const resp = await axios.get(url, { timeout: 12000 });
        const jobs = resp.data && resp.data.jobs ? resp.data.jobs : [];
        formatted = jobs.map(j => ({
          title: j.title,
          company: b.company,
          location: j.location || "Remote",
          salary: "Competitive",
          applyUrl: j.jobUrl,
          description: j.descriptionPlain ? j.descriptionPlain.slice(0, 1500) : `${b.company} is hiring for ${j.title}.`,
          skillsRequired: [j.department || "General"],
          category: j.department || "General",
          provider: "Ashby"
        }));
      } else if (b.type === "lever") {
        const url = `https://api.lever.co/v0/postings/${b.token}?mode=json`;
        const resp = await axios.get(url, { timeout: 12000 });
        const jobs = Array.isArray(resp.data) ? resp.data : [];
        formatted = jobs.map(j => ({
          title: j.text,
          company: b.company,
          location: (j.categories && j.categories.location) || "Remote",
          salary: "Competitive",
          applyUrl: j.hostedUrl,
          description: j.descriptionPlain ? j.descriptionPlain.slice(0, 1500) : `${b.company} is hiring for ${j.text}.`,
          skillsRequired: [(j.categories && j.categories.department) || "General"],
          category: (j.categories && j.categories.department) || "General",
          provider: "Lever"
        }));
      }

      if (formatted.length > 0) {
        const saved = await saveBatch(formatted);
        current = await Job.countDocuments();
        console.log(`[ATS: ${b.company}] Added ${formatted.length} jobs (DB Total: ${current})`);
        if (current >= TARGET_GOAL) {
          console.log(`\n🎉 TARGET REACHED: ${current} jobs in MongoDB Atlas!`);
          break;
        }
      }
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      // ignore
    }
  }

  const finalTotal = await Job.countDocuments();
  console.log(`Final Count in MongoDB: ${finalTotal}`);
  process.exit(0);
}

run().catch(err => {
  console.error("Boost error:", err);
  process.exit(1);
});
