const AdzunaProvider = require("../../services/jobProviders/adzuna.service");
const config = require("../../config/jobAggregation");

describe("AdzunaProvider Normalization", () => {
  let provider;

  beforeAll(() => {
    provider = new AdzunaProvider(config.providers.adzuna);
  });

  it("should normalize a valid Adzuna raw payload correctly", () => {
    const rawJob = {
      id: "123456789",
      title: "Senior Node.js Developer",
      redirect_url: "https://adzuna.com/apply/123",
      description: "Looking for an expert in Node.js and React.",
      company: { display_name: "Tech Corp" },
      location: { display_name: "New York, US" },
      category: { label: "IT Jobs" },
      contract_type: "permanent",
      salary_min: 100000,
      salary_max: 150000,
    };

    const normalized = provider.normalizeJob(rawJob);

    expect(normalized.title).toBe("Senior Node.js Developer");
    expect(normalized.company).toBe("Tech Corp");
    expect(normalized.location).toBe("New York, US");
    expect(normalized.salary).toBe("$100000 - $150000");
    expect(normalized.salaryMin).toBe(100000);
    expect(normalized.salaryMax).toBe(150000);
    expect(normalized.salaryCurrency).toBe("USD");
    expect(normalized.applyUrl).toBe("https://adzuna.com/apply/123");
    expect(normalized.employmentType).toBe("Full-time");
    expect(normalized.isExternal).toBe(true);
    expect(normalized.isRemote).toBe(false);
    expect(normalized.source).toBe("ADZUNA");
    expect(normalized.externalId).toBe("123456789");
    
    // Skills should extract keywords from description
    expect(normalized.skillsRequired).toContain("Node.js");
    expect(normalized.skillsRequired).toContain("React");
  });

  it("should validate correctly with valid fields", () => {
    const normalized = {
      title: "Dev",
      company: "Company",
      applyUrl: "https://example.com/apply",
      location: "remote"
    };
    expect(provider.validateJob(normalized)).toBe(true);
  });

  it("should fail validation if missing fields", () => {
    const invalid = {
      title: "Dev",
      company: "",
      applyUrl: "https://example.com/apply",
      location: "remote"
    };
    expect(provider.validateJob(invalid)).toBe(false);
  });

  it("should fail validation for invalid or dangerous URLs", () => {
    const dangerousJob = {
      title: "Hacker",
      company: "Evil Corp",
      location: "Remote",
      applyUrl: "javascript:alert(1)",
    };
    expect(provider.validateJob(dangerousJob)).toBe(false);

    const noProto = {
      title: "Hacker",
      company: "Evil Corp",
      location: "Remote",
      applyUrl: "www.google.com",
    };
    expect(provider.validateJob(noProto)).toBe(false);
  });
});
