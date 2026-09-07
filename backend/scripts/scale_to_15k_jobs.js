/**
 * Master Ingestion Script to scale MongoDB jobs to 15,000+ across all domains.
 * Sources: Adzuna, Remotive (all categories), The Muse, Arbeitnow, and Top ATS boards.
 */

const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Job = require("../models/job");

const TARGET_GOAL = 15000;
const BATCH_SIZE = 500;

// Domain Classifier
function classifyDomain(title = "", role = "", description = "", category = "") {
  const text = `${title} ${role} ${category} ${description.slice(0, 300)}`.toLowerCase();

  if (text.match(/\b(designer|ui\/ux|ux|ui designer|figma|visual designer|product designer|graphic designer)\b/)) {
    return "Product & Design";
  }
  if (text.match(/\b(product manager|product lead|product owner|technical product)\b/)) {
    return "Product & Design";
  }
  if (text.match(/\b(data analyst|data scientist|machine learning|bi developer|data engineer|analytics|tableau|power bi|ai\/ml|deep learning)\b/)) {
    return "Data & Analytics";
  }
  if (text.match(/\b(marketing|seo|growth|content writer|copywriter|social media|brand|digital marketing|campaign manager)\b/)) {
    return "Marketing & Growth";
  }
  if (text.match(/\b(sales|business development|sdr|bdr|account executive|account manager|client partner|inside sales|sales development)\b/)) {
    return "Sales & Business Dev";
  }
  if (text.match(/\b(finance|accountant|accounting|auditor|payroll|tax|financial analyst|controller|treasury|compliance|legal|counsel)\b/)) {
    return "Finance & Accounting";
  }
  if (text.match(/\b(hr|human resources|talent acquisition|recruiter|people ops|people operations|technical recruiter)\b/)) {
    return "HR & Talent";
  }
  if (text.match(/\b(customer support|customer success|client support|helpdesk|technical support|support specialist|customer care)\b/)) {
    return "Customer Support";
  }
  if (text.match(/\b(operations|supply chain|logistics|procurement|project manager|scrum master|operations manager|delivery lead)\b/)) {
    return "Operations & Logistics";
  }
  if (text.match(/\b(healthcare|nurse|doctor|clinical|medical|hospital|therapist|pharmacy|biotech)\b/)) {
    return "Healthcare & General";
  }
  return "Software & Tech";
}

function extractExperience(title = "") {
  const t = title.toLowerCase();
  if (t.match(/\b(senior|lead|principal|director|head|manager|architect)\b/)) return "5+ Years";
  if (t.match(/\b(mid|intermediate|experienced)\b/)) return "2-5 Years";
  if (t.match(/\b(junior|associate|entry|intern|trainee|fresher|graduate)\b/)) return "0-2 Years";
  return "0-2 Years";
}

// Bulk Saver Helper
async function saveJobBatch(jobList) {
  if (!jobList || jobList.length === 0) return 0;
  
  const ops = [];
  for (const j of jobList) {
    if (!j.applyUrl || !j.title || !j.company) continue;
    
    const domain = classifyDomain(j.title, j.role, j.description, j.category || "");
    const exp = j.experienceRequired || extractExperience(j.title);

    const doc = {
      title: j.title.trim(),
      role: j.role || domain,
      company: j.company.trim(),
      location: j.location || "Remote",
      salary: j.salary || "Competitive",
      applyUrl: j.applyUrl.trim(),
      isExternal: true,
      isActive: true,
      companyLogo: j.companyLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(j.company)}&background=random`,
      description: j.description || `${j.company} is hiring for ${j.title}.`,
      skillsRequired: j.skillsRequired && j.skillsRequired.length ? j.skillsRequired : [domain, "Communication"],
      educationRequired: "Bachelor's Degree or equivalent",
      experienceRequired: exp,
      source: j.source || "EXTERNAL_AGGREGATOR",
      keywords: [domain, exp, ...(j.skillsRequired || [])],
      isRemote: Boolean(j.isRemote || (j.location || "").toLowerCase().includes("remote")),
      providerMetadata: {
        domain: domain,
        provider: j.provider || "Aggregator"
      }
    };

    ops.push({
      updateOne: {
        filter: { applyUrl: doc.applyUrl },
        update: {
          $set: doc,
          $setOnInsert: { createdAt: new Date() }
        },
        upsert: true
      }
    });
  }

  if (ops.length === 0) return 0;

  try {
    const res = await Job.bulkWrite(ops, { ordered: false });
    const inserted = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    return inserted;
  } catch (err) {
    console.error("[BulkWrite Error]:", err.message);
    return 0;
  }
}

// 1. Remotive Harvester (All 10 Categories)
async function harvestRemotive() {
  console.log("\n--- [1/5] Harvesting Remotive (All Categories) ---");
  const categories = [
    "software-dev", "customer-support", "design", "marketing",
    "sales", "product", "business", "data", "finance-legal", "hr", "qa", "writing"
  ];
  let totalSaved = 0;

  for (const cat of categories) {
    try {
      const url = `https://remotive.com/api/remote-jobs?category=${cat}`;
      const resp = await axios.get(url, { timeout: 15000 });
      const rawJobs = resp.data.jobs || [];
      console.log(`[Remotive] Category "${cat}" returned ${rawJobs.length} jobs.`);

      const formatted = rawJobs.map(j => ({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location || "Remote",
        salary: j.salary || "Competitive",
        applyUrl: j.url,
        description: j.description ? j.description.replace(/<[^>]*>?/gm, "").slice(0, 1500) : "",
        skillsRequired: (j.tags || []).slice(0, 6),
        category: cat,
        isRemote: true,
        provider: "Remotive"
      }));

      const saved = await saveJobBatch(formatted);
      totalSaved += saved;
    } catch (err) {
      console.warn(`[Remotive] Error fetching "${cat}":`, err.message);
    }
  }
  console.log(`[Remotive] Ingested ${totalSaved} jobs.`);
  return totalSaved;
}

// 2. Arbeitnow Harvester (Multi-Page)
async function harvestArbeitnow() {
  console.log("\n--- [2/5] Harvesting Arbeitnow (Multi-Page) ---");
  let totalSaved = 0;
  let nextUrl = "https://www.arbeitnow.com/api/job-board-api";
  let page = 1;

  while (nextUrl && page <= 10) {
    try {
      const resp = await axios.get(nextUrl, { timeout: 15000 });
      const rawJobs = resp.data.data || [];
      if (rawJobs.length === 0) break;
      console.log(`[Arbeitnow] Page ${page} returned ${rawJobs.length} jobs.`);

      const formatted = rawJobs.map(j => ({
        title: j.title,
        company: j.company_name,
        location: j.location || "Remote",
        salary: "Competitive",
        applyUrl: j.url,
        description: j.description ? j.description.replace(/<[^>]*>?/gm, "").slice(0, 1500) : "",
        skillsRequired: (j.tags || []).slice(0, 6),
        isRemote: j.remote || false,
        provider: "Arbeitnow"
      }));

      const saved = await saveJobBatch(formatted);
      totalSaved += saved;
      nextUrl = resp.data.links ? resp.data.links.next : null;
      page++;
    } catch (err) {
      console.warn(`[Arbeitnow] Page ${page} failed:`, err.message);
      break;
    }
  }
  console.log(`[Arbeitnow] Ingested ${totalSaved} jobs.`);
  return totalSaved;
}

// 3. The Muse Harvester (Multi-Page)
async function harvestTheMuse() {
  console.log("\n--- [3/5] Harvesting The Muse (Multi-Page) ---");
  let totalSaved = 0;

  for (let page = 1; page <= 15; page++) {
    try {
      const url = `https://www.themuse.com/api/public/jobs?page=${page}`;
      const resp = await axios.get(url, { timeout: 15000 });
      const rawJobs = resp.data.results || [];
      if (rawJobs.length === 0) break;

      const formatted = rawJobs.map(j => {
        const applyUrl = j.refs && j.refs.landing_page ? j.refs.landing_page : null;
        if (!applyUrl) return null;
        const loc = j.locations && j.locations.length ? j.locations[0].name : "Remote";
        const cat = j.categories && j.categories.length ? j.categories[0].name : "";
        return {
          title: j.name,
          company: j.company ? j.company.name : "Enterprise Employer",
          location: loc,
          salary: "Competitive",
          applyUrl: applyUrl,
          description: j.contents ? j.contents.replace(/<[^>]*>?/gm, "").slice(0, 1500) : "",
          skillsRequired: (j.categories || []).map(c => c.name).concat((j.levels || []).map(l => l.name)),
          category: cat,
          provider: "TheMuse"
        };
      }).filter(Boolean);

      const saved = await saveJobBatch(formatted);
      totalSaved += saved;
    } catch (err) {
      console.warn(`[The Muse] Page ${page} error:`, err.message);
    }
  }
  console.log(`[The Muse] Ingested ${totalSaved} jobs.`);
  return totalSaved;
}

// 4. Adzuna Harvester (Multi-Domain x Multi-Page)
async function harvestAdzuna() {
  console.log("\n--- [4/5] Harvesting Adzuna (Multi-Domain) ---");
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) {
    console.log("[Adzuna] Missing ADZUNA_APP_ID or ADZUNA_API_KEY in .env, skipping.");
    return 0;
  }

  const terms = [
    "software engineer", "developer", "frontend", "backend", "full stack",
    "product manager", "ui ux designer", "graphic designer",
    "data analyst", "data scientist", "business analyst",
    "digital marketing", "seo", "content writer",
    "sales manager", "account executive", "business development",
    "accountant", "financial analyst", "auditor",
    "human resources", "recruiter", "talent acquisition",
    "customer support", "customer success",
    "operations manager", "project manager", "scrum master",
    "healthcare", "medical"
  ];

  let totalSaved = 0;
  for (const term of terms) {
    for (let page = 1; page <= 6; page++) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}`;
        const resp = await axios.get(url, {
          params: {
            app_id: appId,
            app_key: apiKey,
            results_per_page: 50,
            what: term,
            max_days_old: 30,
            "content-type": "application/json"
          },
          timeout: 15000
        });

        const rawJobs = resp.data && resp.data.results ? resp.data.results : [];
        if (rawJobs.length === 0) break;

        const formatted = rawJobs.map(j => ({
          title: j.title ? j.title.replace(/<[^>]*>?/gm, "") : "Open Position",
          company: j.company && j.company.display_name ? j.company.display_name : "Enterprise Employer",
          location: j.location && j.location.display_name ? j.location.display_name : "India",
          salary: j.salary_min && j.salary_max ? `₹${Math.round(j.salary_min).toLocaleString()} - ₹${Math.round(j.salary_max).toLocaleString()} a year` : "Competitive",
          applyUrl: j.redirect_url,
          description: j.description ? j.description.replace(/<[^>]*>?/gm, "").slice(0, 1500) : "",
          skillsRequired: [term],
          category: j.category && j.category.label ? j.category.label : term,
          provider: "Adzuna"
        }));

        const saved = await saveJobBatch(formatted);
        totalSaved += saved;
        // Minor delay to respect API limits
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        // Continue loop
        break;
      }
    }
  }
  console.log(`[Adzuna] Ingested ${totalSaved} jobs.`);
  return totalSaved;
}

// 5. Enterprise ATS Boards (Greenhouse, Lever, Ashby)
async function harvestEnterpriseATS() {
  console.log("\n--- [5/5] Harvesting Enterprise Public ATS Boards (All Departments) ---");
  const boards = [
    // Greenhouse
    { type: "gh", company: "Airbnb", token: "airbnb" },
    { type: "gh", company: "Figma", token: "figma" },
    { type: "gh", company: "Reddit", token: "reddit" },
    { type: "gh", company: "Pinterest", token: "pinterest" },
    { type: "gh", company: "DoorDash", token: "doordash" },
    { type: "gh", company: "Celonis", token: "celonis" },
    { type: "gh", company: "GitLab", token: "gitlab" },
    { type: "gh", company: "Dropbox", token: "dropbox" },
    { type: "gh", company: "Twilio", token: "twilio" },
    { type: "gh", company: "Datadog", token: "datadog" },
    { type: "gh", company: "Coinbase", token: "coinbase" },
    { type: "gh", company: "Stripe", token: "stripe" },
    { type: "gh", company: "Instacart", token: "instacart" },
    { type: "gh", company: "Robinhood", token: "robinhood" },
    { type: "gh", company: "Chime", token: "chime" },
    { type: "gh", company: "Gusto", token: "gusto" },
    { type: "gh", company: "HubSpot", token: "hubspot" },
    { type: "gh", company: "Automattic", token: "automattic" },
    { type: "gh", company: "Scale AI", token: "scaleai" },
    { type: "gh", company: "Plaid", token: "plaid" },
    { type: "gh", company: "Brex", token: "brex" },
    { type: "gh", company: "Cockroach Labs", token: "cockroachlabs" },
    { type: "gh", company: "Carta", token: "carta" },
    { type: "gh", company: "Samsara", token: "samsara" },
    { type: "gh", company: "Affirm", token: "affirm" },
    { type: "gh", company: "Asana", token: "asana" },
    { type: "gh", company: "Canva", token: "canva" },
    // Lever
    { type: "lever", company: "Atlassian", token: "atlassian" },
    { type: "lever", company: "Spotify", token: "spotify" },
    { type: "lever", company: "Netflix", token: "netflix" },
    { type: "lever", company: "Palantir", token: "palantir" },
    { type: "lever", company: "Fullscript", token: "fullscript" },
    { type: "lever", company: "Revolut", token: "revolut" },
    { type: "lever", company: "Kraken", token: "kraken" },
    { type: "lever", company: "Checkout.com", token: "checkout" },
    { type: "lever", company: "Klaviyo", token: "klaviyo" },
    { type: "lever", company: "Coursera", token: "coursera" },
    { type: "lever", company: "Ripple", token: "ripple" },
    // Ashby
    { type: "ashby", company: "Notion", token: "notion" },
    { type: "ashby", company: "Linear", token: "linear" },
    { type: "ashby", company: "Ramp", token: "ramp" },
    { type: "ashby", company: "Monzo", token: "monzo" },
    { type: "ashby", company: "Synthesia", token: "synthesia" },
    { type: "ashby", company: "OpenAI", token: "openai" },
    { type: "ashby", company: "LlamaIndex", token: "llamaindex" },
    { type: "ashby", company: "Perplexity AI", token: "perplexity" },
    { type: "ashby", company: "Vercel", token: "vercel" }
  ];

  let totalSaved = 0;

  for (const b of boards) {
    try {
      let formatted = [];
      if (b.type === "gh") {
        const url = `https://boards-api.greenhouse.io/v1/boards/${b.token}/jobs?content=true`;
        const resp = await axios.get(url, { timeout: 12000 });
        const jobs = resp.data.jobs || [];
        formatted = jobs.map(j => ({
          title: j.title,
          company: b.company,
          location: j.location ? j.location.name : "Remote",
          salary: "Competitive",
          applyUrl: j.absolute_url,
          description: j.content ? j.content.replace(/<[^>]*>?/gm, "").slice(0, 1500) : `${b.company} is hiring for ${j.title}.`,
          skillsRequired: (j.departments || []).map(d => d.name),
          category: j.departments && j.departments.length ? j.departments[0].name : "General",
          provider: "Greenhouse"
        }));
      } else if (b.type === "lever") {
        const url = `https://api.lever.co/v0/postings/${b.token}?mode=json`;
        const resp = await axios.get(url, { timeout: 12000 });
        const jobs = Array.isArray(resp.data) ? resp.data : [];
        formatted = jobs.map(j => ({
          title: j.text,
          company: b.company,
          location: j.categories && j.categories.location ? j.categories.location : "Remote",
          salary: "Competitive",
          applyUrl: j.hostedUrl || j.applyUrl,
          description: j.descriptionPlain ? j.descriptionPlain.slice(0, 1500) : `${b.company} is hiring for ${j.text}.`,
          skillsRequired: [j.categories && j.categories.team ? j.categories.team : "General"],
          category: j.categories && j.categories.department ? j.categories.department : "General",
          provider: "Lever"
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
      }

      if (formatted.length > 0) {
        const saved = await saveJobBatch(formatted);
        totalSaved += saved;
        console.log(`[ATS: ${b.company}] Processed ${formatted.length} jobs.`);
      }
      // Brief pause between company queries
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      // Ignore single board failures
    }
  }

  console.log(`[Enterprise ATS] Ingested ${totalSaved} jobs.`);
  return totalSaved;
}

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/job-portal";
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);

  const initialCount = await Job.countDocuments();
  console.log(`\nStarting Job Count in MongoDB: ${initialCount}`);
  console.log(`Target Goal: ${TARGET_GOAL}+ jobs across all 10 domains\n`);

  // Run harvesters
  await harvestRemotive();
  await harvestArbeitnow();
  await harvestTheMuse();
  await harvestEnterpriseATS();
  await harvestAdzuna();

  // Final count
  const finalCount = await Job.countDocuments();
  const activeCount = await Job.countDocuments({ isActive: { $ne: false } });

  console.log("\n==================================================");
  console.log(`[SUCCESS] INGESTION COMPLETED!`);
  console.log(`Initial Jobs: ${initialCount}`);
  console.log(`Current Total Jobs: ${finalCount}`);
  console.log(`Active Jobs: ${activeCount}`);
  console.log("==================================================\n");

  // Domain distribution report
  const domains = await Job.aggregate([
    { $group: { _id: "$providerMetadata.domain", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log("Domain Breakdown across Database:");
  domains.forEach(d => console.log(`  - ${d._id || "Unclassified"}: ${d.count} jobs`));

  process.exit(0);
}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
