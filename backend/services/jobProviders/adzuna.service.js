const axios = require("axios");
const BaseProvider = require("./baseProvider");
const jobAggConfig = require("../../config/jobAggregation");

class AdzunaProvider extends BaseProvider {
  constructor(config) {
    super("ADZUNA", config);
  }

  async authenticate() {
    if (!this.config.appId || !this.config.apiKey) {
      throw new Error("Adzuna configuration missing appId or apiKey");
    }
    return true;
  }

  supportsIncrementalSync() {
    return false; // Adzuna doesn't easily support fetching strictly by "modified since" without complex query building
  }

  async fetchJobs(lastSyncAt) {
    try {
      // Fetch multiple pages to increase volume (e.g., 20 pages of 50 = 1000 jobs)
      let allResults = [];
      for (let page = 1; page <= 20; page++) {
        const url = `${this.config.baseUrl}/in/search/${page}`;
        const response = await axios.get(url, {
                      params: {
              app_id: this.config.appId,
              app_key: this.config.apiKey,
              results_per_page: 50,
              what: "software developer OR full stack developer OR MERN developer OR java developer",
              title_only: "software developer OR full stack developer OR MERN developer OR java developer",
              max_days_old: 30,
              "content-type": "application/json",
            },
        });

        if (response.data && response.data.results) {
          allResults = allResults.concat(response.data.results);
        }
        
        // Brief delay to respect rate limits
        await new Promise(res => setTimeout(res, 500));
      }
      return allResults;
    } catch (error) {
      throw new Error(`Adzuna API Error: ${error.message}`);
    }
  }

  normalizeJob(rawJob) {
    // Normalizes Adzuna's JSON structure to our internal Job Schema
    
    // Attempt to parse skills from description or category
    const skillsRequired = [];
    if (rawJob.category && rawJob.category.label) {
      skillsRequired.push(rawJob.category.label);
    }
    // Minimal heuristic for skills
    if (rawJob.description && rawJob.description.toLowerCase().includes("javascript")) skillsRequired.push("JavaScript");
    if (rawJob.description && rawJob.description.toLowerCase().includes("react")) skillsRequired.push("React");
    if (rawJob.description && rawJob.description.toLowerCase().includes("node")) skillsRequired.push("Node.js");
    // If no specific technical skills are found, we don't force a fallback. 
    // This prevents false positive matches on unrelated jobs.

    return {
      title: rawJob.title ? rawJob.title.replace(/<\/?[^>]+(>|$)/g, "") : "Unknown Title", // Basic HTML stripping
      role: rawJob.category && rawJob.category.label ? rawJob.category.label : "General",
      company: rawJob.company && rawJob.company.display_name ? rawJob.company.display_name : "Unknown",
      location: rawJob.location && rawJob.location.display_name ? rawJob.location.display_name : "Remote",
      salary: rawJob.salary_min && rawJob.salary_max 
        ? `$${rawJob.salary_min} - $${rawJob.salary_max}` 
        : "Competitive",
      salaryMin: rawJob.salary_min ? Number(rawJob.salary_min) : null,
      salaryMax: rawJob.salary_max ? Number(rawJob.salary_max) : null,
      salaryCurrency: "INR", // Adzuna returns localized currency (INR for India)
      description: rawJob.description || "No description provided.",
      skillsRequired: skillsRequired,
      educationRequired: "Not Specified",
      experienceRequired: "Not Specified", 
      applyUrl: rawJob.redirect_url,
      isExternal: true,
      isRemote: (rawJob.location && rawJob.location.display_name && rawJob.location.display_name.toLowerCase().includes("remote")) ? true : false,
      source: this.name,
      externalId: rawJob.id ? String(rawJob.id) : null,
      employmentType: rawJob.contract_type === "permanent" ? "Full-time" : rawJob.contract_type === "contract" ? "Contract" : "Full-time",
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      keywords: skillsRequired,
      providerMetadata: jobAggConfig.storeRawPayloads ? { raw: rawJob } : {},
    };
  }
}

module.exports = AdzunaProvider;


