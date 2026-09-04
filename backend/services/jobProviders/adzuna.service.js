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
      // Multi-domain search terms to cover all job fields (Tech, Management, Sales, Marketing, HR, Finance, Design, Data, Operations)
      const searchTerms = [
        "developer",
        "engineer",
        "manager",
        "designer",
        "marketing",
        "sales",
        "analyst",
        "accountant",
        "hr",
        "operations",
        "support",
        "consultant"
      ];
      
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

      console.log(`[Adzuna Engine] Fetched ${allResults.length} total results, ${uniqueMap.size} unique live jobs across all domains.`);
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
    if (desc.includes("marketing")) skillsRequired.push("Marketing");
    if (desc.includes("sales")) skillsRequired.push("Sales");
    if (desc.includes("design") || desc.includes("figma")) skillsRequired.push("UI/UX Design");
    if (desc.includes("finance") || desc.includes("excel")) skillsRequired.push("Finance");
    if (desc.includes("management") || desc.includes("leadership")) skillsRequired.push("Management");

    return {
      title: rawJob.title ? rawJob.title.replace(/<\/?[^>]+(>|$)/g, "") : "Professional Position",
      role: rawJob.category && rawJob.category.label ? rawJob.category.label : "General",
      company: rawJob.company && rawJob.company.display_name ? rawJob.company.display_name : "Hiring Enterprise",
      location: rawJob.location && rawJob.location.display_name ? rawJob.location.display_name : "India",
      salary: rawJob.salary_min && rawJob.salary_max 
        ? `₹${Number(rawJob.salary_min).toLocaleString()} - ₹${Number(rawJob.salary_max).toLocaleString()}` 
        : "Competitive Salary",
      salaryMin: rawJob.salary_min ? Number(rawJob.salary_min) : null,
      salaryMax: rawJob.salary_max ? Number(rawJob.salary_max) : null,
      salaryCurrency: "INR",
      description: rawJob.description || "Exciting career opportunity to join a dynamic professional team.",
      skillsRequired: skillsRequired.length > 0 ? skillsRequired : [rawJob.category?.label || "General", "Communication"],
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
