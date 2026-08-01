const axios = require("axios");
const BaseProvider = require("./baseProvider");

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
      // Fetch jobs from US as default for this example, with max results
      // Adjust parameters based on required categories or locations
      const url = `${this.config.baseUrl}/us/search/1`;
      const response = await axios.get(url, {
        params: {
          app_id: this.config.appId,
          app_key: this.config.apiKey,
          results_per_page: 50,
          what: "software developer",
          content-type: "application/json",
        },
      });

      if (response.data && response.data.results) {
        return response.data.results;
      }
      return [];
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
    if (skillsRequired.length === 0) skillsRequired.push("Software Development");

    return {
      title: rawJob.title ? rawJob.title.replace(/<\/?[^>]+(>|$)/g, "") : "Unknown Title", // Basic HTML stripping
      role: rawJob.category && rawJob.category.label ? rawJob.category.label : "General",
      company: rawJob.company && rawJob.company.display_name ? rawJob.company.display_name : "Unknown",
      location: rawJob.location && rawJob.location.display_name ? rawJob.location.display_name : "Remote",
      salary: rawJob.salary_min && rawJob.salary_max 
        ? `$${rawJob.salary_min} - $${rawJob.salary_max}` 
        : "Competitive",
      description: rawJob.description || "No description provided.",
      skillsRequired: skillsRequired,
      educationRequired: "Not Specified",
      experienceRequired: "Not Specified", 
      applyUrl: rawJob.redirect_url,
      isExternal: true,
      source: this.name,
      externalId: rawJob.id ? String(rawJob.id) : null,
      employmentType: rawJob.contract_type === "permanent" ? "Full-time" : rawJob.contract_type === "contract" ? "Contract" : "Full-time",
      keywords: skillsRequired,
    };
  }
}

module.exports = AdzunaProvider;
