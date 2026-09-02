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
    return false;
  }

  async fetchJobs(lastSyncAt) {
    try {
      let allResults = [];
      // Clean tech keywords to query sequentially without invalid boolean syntax
      const searchTerms = ["developer", "engineer", "software", "full stack", "react", "python"];
      
      for (const term of searchTerms) {
        for (let page = 1; page <= 3; page++) {
          const url = `${this.config.baseUrl}/in/search/${page}`;
          try {
            const response = await axios.get(url, {
              params: {
                app_id: this.config.appId,
                app_key: this.config.apiKey,
                results_per_page: 50,
                what: term,
                max_days_old: 14,
                "content-type": "application/json",
              },
            });

            if (response.data && response.data.results) {
              allResults = allResults.concat(response.data.results);
            }
          } catch (err) {
            console.error(`[Adzuna Engine] Error fetching term "${term}" page ${page}:`, err.message);
          }
          // Delay to respect API rate limits
          await new Promise((res) => setTimeout(res, 300));
        }
      }
      
      // Deduplicate fetched jobs by Adzuna ID
      const uniqueMap = new Map();
      allResults.forEach(j => {
        if (j.id && !uniqueMap.has(String(j.id))) {
          uniqueMap.set(String(j.id), j);
        }
      });

      console.log(`[Adzuna Engine] Fetched ${allResults.length} total results, ${uniqueMap.size} unique live jobs.`);
      return Array.from(uniqueMap.values());
    } catch (error) {
      throw new Error(`Adzuna API Error: ${error.message}`);
    }
  }

  normalizeJob(rawJob) {
    const skillsRequired = [];
    if (rawJob.category && rawJob.category.label) {
      skillsRequired.push(rawJob.category.label);
    }
    
    const desc = rawJob.description ? rawJob.description.toLowerCase() : "";
    if (desc.includes("javascript") || desc.includes("js")) skillsRequired.push("JavaScript");
    if (desc.includes("react")) skillsRequired.push("React");
    if (desc.includes("node")) skillsRequired.push("Node.js");
    if (desc.includes("python")) skillsRequired.push("Python");
    if (desc.includes("java")) skillsRequired.push("Java");
    if (desc.includes("sql")) skillsRequired.push("SQL");

    return {
      title: rawJob.title ? rawJob.title.replace(/<\/?[^>]+(>|$)/g, "") : "Software Engineer",
      role: rawJob.category && rawJob.category.label ? rawJob.category.label : "Development",
      company: rawJob.company && rawJob.company.display_name ? rawJob.company.display_name : "Tech Enterprise",
      location: rawJob.location && rawJob.location.display_name ? rawJob.location.display_name : "India",
      salary: rawJob.salary_min && rawJob.salary_max 
        ? `₹${Number(rawJob.salary_min).toLocaleString()} - ₹${Number(rawJob.salary_max).toLocaleString()}` 
        : "Competitive Salary",
      salaryMin: rawJob.salary_min ? Number(rawJob.salary_min) : null,
      salaryMax: rawJob.salary_max ? Number(rawJob.salary_max) : null,
      salaryCurrency: "INR",
      description: rawJob.description || "Exciting opportunity for a qualified software engineer to join a dynamic team.",
      skillsRequired: skillsRequired.length > 0 ? skillsRequired : ["Software Engineering", "Problem Solving"],
      educationRequired: "Bachelor's Degree",
      experienceRequired: "Not Specified",
      applyUrl: rawJob.redirect_url,
      isExternal: true,
      isRemote: (rawJob.location && rawJob.location.display_name && rawJob.location.display_name.toLowerCase().includes("remote")) ? true : false,
      source: "Adzuna",
      externalId: rawJob.id ? String(rawJob.id) : null,
      employmentType: rawJob.contract_type === "contract" ? "Contract" : "Full-time",
      createdAt: rawJob.created ? new Date(rawJob.created) : new Date(),
      updatedAt: rawJob.created ? new Date(rawJob.created) : new Date(),
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      keywords: skillsRequired,
      providerMetadata: jobAggConfig.storeRawPayloads ? { raw: rawJob } : {},
    };
  }
}

module.exports = AdzunaProvider;
