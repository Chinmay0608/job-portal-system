jest.mock("node:dns/promises", () => ({
  lookup: jest.fn().mockResolvedValue([{ address: "8.8.8.8", family: 4 }]),
}));
jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("../models/job", () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));
jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: JSON.stringify({
          roleSummary: "Comprehensive expanded description from AI.",
          responsibilities: ["Design embedded DSP software", "Optimize audio algorithms"],
          qualifications: ["C/C++ proficiency", "3+ years DSP experience"],
          preferredQualifications: ["Audio processing expertise"],
          workArrangement: "Yerwada, Pune",
          culture: "Collaborative and innovative.",
          eeoStatement: "Equal opportunity employer.",
        }),
      }),
    },
  })),
}));

const Job = require("../models/job");
const axios = require("axios");
const {
  isDescriptionSnippet,
  ensureFullJobDescription,
  scrapeExternalPosting,
} = require("../services/fullDescriptionService");
const { getFullJobDescription } = require("../controllers/jobController");

describe("fullDescriptionService & getFullJobDescription controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    axios.get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "text/html" },
      data: `<html><script type="application/ld+json">${JSON.stringify({
        "@type": "JobPosting",
        title: "Consulting Analyst",
        description:
          "<p>Analyze client business problems and support consulting teams with research and recommendations.</p>",
        responsibilities: "Analyze client business problems",
        qualifications: "Consulting experience",
        skills: ["Data analysis"],
      })}</script><body><nav>Jobs menu</nav></body></html>`,
    });
  });

  describe("isDescriptionSnippet", () => {
    it("identifies short snippets as snippets", () => {
      expect(isDescriptionSnippet("Short description here")).toBe(true);
      expect(isDescriptionSnippet(null)).toBe(true);
      expect(isDescriptionSnippet("")).toBe(true);
    });

    it("identifies snippets ending with ellipsis", () => {
      const longSnippetWithEllipsis = "A".repeat(400) + "...";
      expect(isDescriptionSnippet(longSnippetWithEllipsis)).toBe(true);
    });

    it("identifies rich complete descriptions as NOT snippets", () => {
      const completeDescription =
        "<h3>About the Role</h3><p>" +
        "We are looking for a software engineer to join our core infrastructure team. " +
        "You will design scalable cloud architectures and collaborate with cross-functional teams to deliver enterprise systems. " +
        "We value high code quality, automated testing, continuous integration, and proactive communication across departments. " +
        "Our engineers tackle challenging real-time scaling problems with modern web technologies." +
        "</p>";
      expect(isDescriptionSnippet(completeDescription)).toBe(false);
    });
  });

  describe("ensureFullJobDescription", () => {
    it("returns existing description unchanged if it is already structured correctly", async () => {
      const fullDesc =
        "<h3>Overview</h3><p>" +
        "Comprehensive requisition details for enterprise job. ".repeat(15) +
        "</p>";
      const job = {
        _id: "job-101",
        description: fullDesc,
      };

      const result = await ensureFullJobDescription(job);
      expect(result).toBe(fullDesc);
      expect(Job.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("expands a truncated snippet from employer posting facts and persists it", async () => {
      const snippet =
        "Collaborate with consulting teams to analyze client business problems and...";
      const job = {
        _id: "job-102",
        title: "Consulting Analyst",
        company: "Cognizant",
        description: snippet,
        applyUrl: "https://jobs.example/consulting-analyst",
      };

      const result = await ensureFullJobDescription(job);
      expect(result).toContain("<h3>Standard Job Title</h3>");
      expect(result).toContain("<h3>Key Responsibilities</h3>");
      expect(result).toContain("<h3>Required Qualifications</h3>");
      expect(result).toContain("Data analysis");
      expect(result).toContain("<li>Consulting experience</li>");
      expect(result).toContain("<li>Data analysis</li>");
      expect(axios.get).toHaveBeenCalledWith(
        "https://jobs.example/consulting-analyst",
        expect.objectContaining({ maxRedirects: 0 }),
      );
      expect(Job.findByIdAndUpdate).toHaveBeenCalledWith("job-102", {
        description: expect.stringContaining("Standard Job Title"),
        isFullDescription: true,
      });
    });

    it("keeps the source snippet when the employer posting is unavailable", async () => {
      process.env.GEMINI_API_KEY = "dummy-gemini-key";
      axios.get.mockRejectedValue(new Error("Request failed with status code 403"));

      const snippet = "Level 3 DSP Engineer - Platforming Experience: 3-8 years... Tra…";
      const job = {
        _id: "job-dsp-103",
        title: "DSP Engineer",
        company: "Trigent Software Private Limited",
        location: "Yerwada, Pune",
        description: snippet,
        applyUrl: "https://www.adzuna.in/details/5924576092",
      };

      const result = await ensureFullJobDescription(job);
      expect(result).toBe(snippet);
      expect(Job.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("repairs previously misstructured descriptions even when marked complete", async () => {
      const sourceDescription = [
        "<p><strong>Job Description</strong></p>",
        "<p><strong>Required Experience and Skills</strong></p>",
        "<ul><li>1-4 years of experience building end-to-end web applications.</li>",
        "<li>Strong knowledge of .NET, C#, ASP.NET, Angular, TypeScript, and SQL.</li></ul>",
      ].join("");
      axios.get.mockResolvedValue({
        status: 200,
        headers: { "content-type": "text/html" },
        data: `<script type="application/ld+json">${JSON.stringify({
          "@type": "JobPosting",
          title: "Software Engineer",
          description: sourceDescription,
        })}</script>`,
      });
      const staleDescription =
        "<h3>Standard Job Title</h3><p>Software Engineer</p>" +
        "<h3>Role Summary</h3><p>Job Description Required Experience and Skills Experience: 1-4 years building web applications.</p>" +
        "<h3>Key Responsibilities</h3><p>Not specified in the employer posting.</p>" +
        "<h3>Required Qualifications</h3><p>Not specified in the employer posting.</p>";

      const result = await ensureFullJobDescription({
        _id: "job-stale",
        title: "Software Engineer",
        company: "Eurofins",
        description: staleDescription,
        isFullDescription: true,
        applyUrl: "https://jobs.example/software-engineer",
      });

      expect(result).toContain("<h3>Required Qualifications</h3>");
      expect(result).toContain(
        "<li>1-4 years of experience building end-to-end web applications.</li>",
      );
      expect(result).toContain(
        "<li>Strong knowledge of .NET, C#, ASP.NET, Angular, TypeScript, and SQL.</li>",
      );
      expect(Job.findByIdAndUpdate).toHaveBeenCalledWith("job-stale", {
        description: expect.stringContaining("Required Qualifications"),
        isFullDescription: false,
      });
    });

    it("does not rewrite an invalid saved description without an employer source", async () => {
      const description =
        "<h3>Role Summary</h3><p>Required</p>" +
        "<h3>Key Responsibilities</h3><p>undefined</p>" +
        "<h3>Required Qualifications</h3><ul><li>1-4 years of relevant experience</li><li>Strong .NET and TypeScript skills</li></ul>";
      const result = await ensureFullJobDescription({
        _id: "job-saved-stale",
        title: "Software Engineer",
        company: "Eurofins",
        isFullDescription: true,
        description,
      });

      expect(result).toBe(description);
      expect(Job.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("does not fetch private or local employer URLs", async () => {
      const result = await ensureFullJobDescription({
        _id: "job-private",
        description: "A short preview...",
        applyUrl: "http://127.0.0.1/admin",
      });

      expect(result).toBe("A short preview...");
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe("scrapeExternalPosting", () => {
    it("extracts JobPosting metadata rather than page navigation", () => {
      const details = scrapeExternalPosting(`<html>
        <nav>Site navigation</nav>
        <script type="application/ld+json">${JSON.stringify({
          "@type": "JobPosting",
          title: "Engineer",
          description: "<p>Build and maintain reliable services.</p>",
          jobBenefits: "Medical and retirement",
          employmentType: "FULL_TIME",
        })}</script>
      </html>`);

      expect(details.title).toBe("Engineer");
      expect(details.description).toBe("Build and maintain reliable services.");
      expect(details.compensation).toContain("Medical and retirement");
      expect(details.workArrangement).toContain("FULL_TIME");
    });

    it("preserves section and bullet boundaries from HTML job descriptions", () => {
      const details = scrapeExternalPosting(
        `<script type="application/ld+json">${JSON.stringify({
          "@type": "JobPosting",
          title: "Software Engineer",
          description:
            "<p><strong>Job Description</strong></p><p><strong>Required Experience and Skills</strong></p><ul><li>1-4 years building web applications.</li><li>Strong knowledge of TypeScript.</li></ul>",
        })}</script>`,
      );

      expect(details.description).toMatch(
        /Job Description\s+Required Experience and Skills/,
      );
      expect(details.description).toContain(
        "• 1-4 years building web applications.",
      );
      expect(details.description).toContain(
        "• Strong knowledge of TypeScript.",
      );
    });

    it("extracts Zoho Recruit embedded JSON postings and repairs synthetic $undefined placeholders", () => {
      const zohoHtml = `<html>
        <head><title>Digital Aicademy - System Developer intern - Remote Job</title></head>
        <body>
          <script>
            var jobs = JSON.parse('[{\\x22Posting_Title\\x22:\\x22System Developer intern\\x22,\\x22Remote_Job\\x22:true,\\x22Industry\\x22:\\x22IT Services\\x22,\\x22Work_Experience\\x22:\\x221-3 years\\x22,\\x22Job_Type\\x22:\\x22Full time\\x22,\\x22Job_Description\\x22:\\x22<h2>Summary</h2><div>We are seeking a motivated System Developer Intern.</div><h2>Responsibilities</h2><ul><li>Develop Python and Zoho apps.</li></ul><h2>Requirements</h2><ul><li>Proficiency in Python and SQL.</li></ul>\\x22}]');
          </script>
        </body>
      </html>`;
      const details = scrapeExternalPosting(zohoHtml);
      expect(details.isJobPosting).toBe(true);
      expect(details.title).toBe("System Developer intern");
      expect(details.company).toBe("Digital Aicademy");
      expect(details.description).toContain("We are seeking a motivated System Developer Intern.");
      expect(details.description).toContain("• Develop Python and Zoho apps.");

      const syntheticPlaceholder =
        "## About the Role\nAiCademy is hiring for **System Developer Intern** in the $undefined space. Location: Remote (Remote). Type: Internship.\n\n## How to Apply\nUse the Apply button to open the employer's official application page.";
      expect(isDescriptionSnippet(syntheticPlaceholder)).toBe(true);
    });

    it("expands Greenhouse slug URLs via the Greenhouse board JSON API", async () => {
      axios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          jobs: [
            {
              id: 5552530004,
              title: "Software Engineer - C++",
              location: { name: "San Francisco, CA" },
              absolute_url:
                "https://boards.greenhouse.io/figma/jobs/5552530004?gh_jid=5552530004",
              content:
                "&lt;p&gt;Figma is growing our team of builders.&lt;/p&gt;&lt;h3&gt;What you’ll do at Figma:&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;Optimize C++ and WebAssembly rendering performance.&lt;/li&gt;&lt;/ul&gt;&lt;h3&gt;We’d love to hear from you if you have:&lt;/h3&gt;&lt;ul&gt;&lt;li&gt;4+ years of C++ software engineering experience.&lt;/li&gt;&lt;/ul&gt;",
            },
          ],
        },
      });

      const job = {
        _id: "job-figma-cpp",
        title: "Software Engineer - C++",
        company: "Figma",
        location: "San Francisco",
        description:
          "Optimize graphics rendering and core application performance to ensure smooth interactions.",
        applyUrl: "https://boards.greenhouse.io/figma/jobs/software-engineer-c++",
      };

      const result = await ensureFullJobDescription(job);
      expect(result).toContain("Optimize C++ and WebAssembly rendering performance.");
      expect(result).toContain("4+ years of C++ software engineering experience.");
      expect(Job.findByIdAndUpdate).toHaveBeenCalledWith(
        "job-figma-cpp",
        expect.objectContaining({
          isFullDescription: true,
          applyUrl:
            "https://boards.greenhouse.io/figma/jobs/5552530004?gh_jid=5552530004",
        }),
      );
    });
  });

  describe("getFullJobDescription Controller", () => {
    it("returns 404 when job does not exist", async () => {
      Job.findById.mockResolvedValue(null);
      const req = { params: { id: "non-existent-id" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await expect(getFullJobDescription(req, res)).rejects.toThrow(
        "Job not found",
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 200 with expanded description when job exists", async () => {
      axios.get.mockResolvedValueOnce({
        status: 200,
        headers: { "content-type": "text/html" },
        data: `<html><script type="application/ld+json">${JSON.stringify({
          "@type": "JobPosting",
          title: "Software Engineer",
          hiringOrganization: { name: "Google" },
          description:
            "<p>Develop enterprise systems and scalable web applications across distributed cloud environments.</p>",
          responsibilities: "Develop enterprise systems",
          qualifications: "Bachelor degree in CS or equivalent",
        })}</script></html>`,
      });
      const job = {
        _id: "job-200",
        title: "Software Engineer",
        company: "Google",
        description: "Develop enterprise systems and...",
        applyUrl: "https://jobs.example/software-engineer",
      };
      Job.findById.mockResolvedValue(job);

      const req = { params: { id: "job-200" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await getFullJobDescription(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: "job-200",
          description: expect.stringContaining("Standard Job Title"),
          isFullDescription: true,
        }),
      );
    });

    it("marks the original snippet as incomplete when expansion is unavailable", async () => {
      Job.findById.mockResolvedValue({
        _id: "job-201",
        description: "A short preview of this job...",
      });

      const req = { params: { id: "job-201" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await getFullJobDescription(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: "job-201",
          description: "A short preview of this job...",
          isFullDescription: false,
        }),
      );
    });
  });
});
