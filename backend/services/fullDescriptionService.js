const dns = require("node:dns/promises");
const net = require("node:net");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenAI } = require("@google/genai");
const { withApiKey, hasApiKey } = require("../utils/apiKeyRotation");

const NOT_PROVIDED = "Not specified in the employer posting.";
const SECTIONS = [
  ["standardTitle", "Standard Job Title"],
  ["roleSummary", "Role Summary"],
  ["responsibilities", "Key Responsibilities"],
  ["requiredQualifications", "Required Qualifications"],
  ["preferredQualifications", "Preferred Qualifications"],
  ["compensationBenefits", "Compensation and Benefits"],
  ["workArrangementLocation", "Work Arrangement and Location"],
  ["cultureValues", "Company Culture and Values"],
  ["eeoStatement", "EEO Statement"],
];
const DESCRIPTION_HEADINGS = [
  [
    "roleSummary",
    [
      "job description",
      "role summary",
      "position summary",
      "about the role",
      "about the position",
      "overview",
    ],
  ],
  [
    "responsibilities",
    [
      "key responsibilities",
      "primary responsibilities",
      "responsibilities",
      "what you'll do",
      "what you will do",
      "duties",
      "essential functions",
    ],
  ],
  [
    "requiredQualifications",
    [
      "required experience and skills",
      "required skills and experience",
      "required qualifications",
      "minimum qualifications",
      "minimum requirements",
      "qualifications",
      "requirements",
      "skills and experience",
      "experience and skills",
      "what you'll need",
      "what you will need",
    ],
  ],
  [
    "preferredQualifications",
    [
      "preferred qualifications",
      "preferred experience",
      "nice to have",
      "nice-to-have",
      "desired qualifications",
    ],
  ],
  [
    "compensationBenefits",
    [
      "compensation and benefits",
      "salary and benefits",
      "benefits",
      "what we offer",
      "perks",
    ],
  ],
  [
    "workArrangementLocation",
    [
      "work arrangement and location",
      "work location",
      "location",
      "working arrangement",
    ],
  ],
  [
    "cultureValues",
    [
      "company culture and values",
      "culture and values",
      "our culture",
      "company culture",
    ],
  ],
  [
    "eeoStatement",
    ["equal opportunity", "equal employment opportunity", "eeo statement"],
  ],
].flatMap(([key, headings]) => headings.map((heading) => ({ key, heading })));

function isDescriptionSnippet(description) {
  if (!description) return true;
  const trimmed = description.trim();
  return (
    isMisstructuredDescription(trimmed) ||
    trimmed.length < 350 ||
    trimmed.endsWith("...") ||
    trimmed.endsWith("…") ||
    /\band\s*\.\.\.$/i.test(trimmed) ||
    /read more on career portal|preview snippet/i.test(trimmed)
  );
}

function isPublicAddress(address) {
  const version = net.isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168)) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }
  if (version === 6) {
    const normalized = address.toLowerCase();
    return !(
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("::ffff:") ||
      /^f[cd]/.test(normalized) ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff") ||
      normalized.startsWith("2001:db8:")
    );
  }
  return false;
}

async function resolvePublicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid employer job URL");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local") ||
    url.hostname.endsWith(".internal") ||
    url.hostname === "localhost"
  ) {
    throw new Error("Employer job URL must be a public HTTP(S) address");
  }

  const addresses = net.isIP(url.hostname)
    ? [{ address: url.hostname, family: net.isIP(url.hostname) }]
    : await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (
    !addresses.length ||
    addresses.some(({ address }) => !isPublicAddress(address))
  ) {
    throw new Error("Employer job URL resolved to a non-public address");
  }

  return { url, addresses };
}

async function fetchPosting(urlValue) {
  let currentUrl = urlValue;

  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const { url, addresses } = await resolvePublicUrl(currentUrl);
    const addressByFamily = new Map(
      addresses.map(({ address, family }) => [family, address]),
    );
    const response = await axios.get(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobPortal/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 8000,
      maxRedirects: 0,
      maxContentLength: 2_000_000,
      responseType: "text",
      validateStatus: (status) => status < 400,
      lookup: (_hostname, options, callback) => {
        if (options?.all) {
          callback(null, addresses);
          return;
        }
        const address =
          addressByFamily.get(options?.family) || addresses[0].address;
        callback(null, address, net.isIP(address));
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location || redirects === 5)
        throw new Error("Too many redirects fetching employer posting");
      currentUrl = new URL(location, url).toString();
      continue;
    }
    if (typeof response.data !== "string")
      throw new Error("Employer posting was not HTML");
    return response.data;
  }

  throw new Error("Too many redirects fetching employer posting");
}

function findJobPosting(value) {
  if (Array.isArray(value)) return value.map(findJobPosting).find(Boolean);
  if (!value || typeof value !== "object") return null;
  const types = Array.isArray(value["@type"])
    ? value["@type"]
    : [value["@type"]];
  if (types.some((type) => type === "JobPosting")) return value;
  return findJobPosting(value["@graph"]);
}

function asText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    if (value.name || value.description || value.address?.addressLocality) {
      return value.name || value.description || value.address.addressLocality;
    }
    if (value.value && typeof value.value === "object") {
      const amount = [
        value.value.minValue,
        value.value.maxValue,
        value.value.value,
      ]
        .filter((part) => part !== undefined)
        .join("–");
      return [value.currency, amount].filter(Boolean).join(" ");
    }
    return "";
  }
  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return /^(?:undefined|null|not specified|n\/a)$/i.test(text) ? "" : text;
}

function descriptionText(value) {
  if (typeof value !== "string") return asText(value);
  const $ = cheerio.load(`<div>${value}</div>`);
  const content = $("div").first();
  content.find("br").replaceWith("\n");
  content.find("li").each((_, item) => {
    $(item).replaceWith(`\n• ${$(item).text()}\n`);
  });
  content
    .find("p, h1, h2, h3, h4, h5, h6, div, section, tr")
    .each((_, block) => {
      $(block).prepend("\n").append("\n");
    });
  return content
    .text()
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseDescriptionSections(description) {
  const text = String(description || "")
    .replace(/\r/g, "")
    .trim();
  const headings = [...DESCRIPTION_HEADINGS].sort(
    (a, b) => b.heading.length - a.heading.length,
  );
  const escapedHeadings = headings
    .map(({ heading }) => heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const pattern = new RegExp(`(^|\\s)(${escapedHeadings})\\s*:?\\s*`, "gi");
  const sections = {};
  const matches = [...text.matchAll(pattern)];
  if (!matches.length)
    return { hasHeadings: false, sections: { roleSummary: text } };

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = headings.find(
      (item) => item.heading.toLowerCase() === match[2].toLowerCase(),
    );
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const value = text.slice(start, end).trim();
    if (value)
      sections[heading.key] = [sections[heading.key], value]
        .filter(Boolean)
        .join("\n");
  }
  if (
    sections.requiredQualifications &&
    /^required$/i.test(sections.roleSummary || "")
  ) {
    delete sections.roleSummary;
  }

  return { hasHeadings: true, sections };
}

function isMisstructuredDescription(description) {
  const $ = cheerio.load(description || "");
  let roleSummary = "";
  let hasInvalidSection = false;
  $("h3").each((_, heading) => {
    const title = $(heading).text().trim().toLowerCase();
    const content = $(heading).nextUntil("h3").text().trim();
    if (title === "role summary") roleSummary = content;
    if (
      ["key responsibilities", "required qualifications"].includes(title) &&
      /^(?:undefined|null|not specified in the employer posting\.?)$/i.test(
        content,
      )
    ) {
      hasInvalidSection = true;
    }
  });
  return (
    hasInvalidSection || /^(?:required|undefined|null)$/i.test(roleSummary)
  );
}

function structuredSection(description, title) {
  const $ = cheerio.load(description || "");
  let value = "";
  $("h3").each((_, heading) => {
    if ($(heading).text().trim().toLowerCase() === title.toLowerCase()) {
      value = $(heading)
        .nextUntil("h3")
        .toArray()
        .map((element) => $.html(element))
        .join("");
    }
  });
  return value;
}

function readStoredStructuredDetails(description) {
  const section = (title) => {
    const value = descriptionText(structuredSection(description, title));
    return /^(?:undefined|null|not specified in the employer posting\.?)$/i.test(
      value,
    )
      ? ""
      : value;
  };
  const roleSummary = section("Role Summary");
  return {
    title: section("Standard Job Title"),
    description: /^(?:required|undefined|null)$/i.test(roleSummary)
      ? ""
      : roleSummary,
    responsibilities: section("Key Responsibilities"),
    qualifications: section("Required Qualifications"),
    preferredQualifications: section("Preferred Qualifications"),
    compensation: section("Compensation and Benefits"),
    workArrangement: section("Work Arrangement and Location"),
    culture: section("Company Culture and Values"),
  };
}

function toList(value) {
  if (!value) return [];
  const items = (Array.isArray(value) ? value : [value])
    .flatMap((entry) =>
      entry == null
        ? []
        : String(entry).split(/\n+|(?<=[.!?])\s+|;\s+|[•●▪]\s*/),
    )
    .map((item) => item.replace(/^\s*[-*•●▪]\s*/, "").trim())
    .filter(
      (item) =>
        item &&
        !/^(?:undefined|null|not specified in the employer posting\.?|n\/a)$/i.test(
          item,
        ),
    );
  return [...new Set(items)];
}

function scrapeExternalPosting(html) {
  const $ = cheerio.load(html);
  let posting = null;
  $('script[type="application/ld+json"]').each((_, script) => {
    if (posting) return;
    try {
      posting = findJobPosting(JSON.parse($(script).contents().text()));
    } catch {
      // Ignore malformed JSON-LD and continue looking for a valid posting.
    }
  });

  const selectors = [
    '[data-qa="job-description"]',
    '[class*="job-description" i]',
    '[id*="job-description" i]',
    '[class*="jobDescription"]',
    '[id*="jobDescription"]',
    '[class*="posting-requirements" i]',
    "article",
    "main",
  ];
  let description = descriptionText(posting?.description);
  if (!description) {
    for (const selector of selectors) {
      const candidate = $(selector).first().clone();
      candidate
        .find(
          "script, style, noscript, nav, header, footer, svg, iframe, button, form",
        )
        .remove();
      const text = descriptionText(candidate.html() || "");
      if (text.length > 150) {
        description = text;
        break;
      }
    }
  }

  return {
    title: asText(posting?.title),
    description: description.slice(0, 16000),
    responsibilities: descriptionText(posting?.responsibilities),
    qualifications: descriptionText(posting?.qualifications),
    skills: descriptionText(posting?.skills),
    education: descriptionText(posting?.educationRequirements),
    experience: descriptionText(posting?.experienceRequirements),
    preferredQualifications: descriptionText(posting?.preferredQualifications),
    compensation: [
      asText(posting?.baseSalary),
      asText(posting?.incentiveCompensation),
      asText(posting?.jobBenefits),
    ]
      .filter(Boolean)
      .join(". "),
    workArrangement: [
      asText(posting?.jobLocationType),
      asText(posting?.applicantLocationRequirements),
      asText(posting?.jobLocation),
      asText(posting?.employmentType),
      asText(posting?.workHours),
    ]
      .filter(Boolean)
      .join(". "),
    culture: [
      asText(posting?.hiringOrganization?.description),
      asText(posting?.industry),
    ]
      .filter(Boolean)
      .join(". "),
  };
}

function buildStructuredDescription(job, details) {
  const parsed = parseDescriptionSections(details.description);
  const sections = parsed.sections;
  const values = {
    standardTitle: details.title || job.title,
    roleSummary: parsed.hasHeadings
      ? sections.roleSummary
      : details.description,
    responsibilities: toList([
      sections.responsibilities,
      details.responsibilities,
    ]),
    requiredQualifications: toList([
      sections.requiredQualifications,
      details.qualifications,
      details.skills,
      details.education,
      details.experience,
    ]),
    preferredQualifications: toList([
      sections.preferredQualifications,
      details.preferredQualifications,
    ]),
    compensationBenefits: details.compensation || job.salary,
    workArrangementLocation:
      sections.workArrangementLocation ||
      details.workArrangement ||
      [job.isRemote ? "Remote" : "", job.location].filter(Boolean).join(". "),
    cultureValues: sections.cultureValues || details.culture,
    eeoStatement: sections.eeoStatement,
  };
  return SECTIONS.map(([key, heading]) => {
    const value = values[key] || NOT_PROVIDED;
    const body = Array.isArray(value)
      ? value.length
        ? `<ul>${value.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : `<p>${NOT_PROVIDED}</p>`
      : `<p>${escapeHtml(value)}</p>`;
    return `<h3>${heading}</h3>${body}`;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function generateDetailsWithAI(job) {
  if (!hasApiKey("GEMINI") && !hasApiKey("GROQ")) return null;

  const prompt = `Act as an expert enterprise technical recruiter. A job posting snippet from ${job.company || "the hiring employer"} was truncated by an aggregator:
Job Title: ${job.title}
Company: ${job.company || "Hiring Employer"}
Location: ${job.location || "Hybrid / Remote"}
Skills: ${(job.skillsRequired || []).join(", ") || "Technical and analytical skills"}
Salary: ${job.salary || "Competitive Market Rate"}
Available Snippet: "${(job.description || "").replace(/<[^>]*>/g, " ").trim().slice(0, 1200)}"

Reconstruct and expand this snippet into a full, detailed, professional enterprise job requisition.
Return ONLY valid JSON matching this schema:
{
  "roleSummary": "2-3 comprehensive paragraphs describing the mission, scope, team impact, and day-to-day focus of the role",
  "responsibilities": ["6 to 8 clear, actionable, and detailed bullet points for key responsibilities and deliverables"],
  "qualifications": ["6 to 8 bullet points covering required qualifications, hands-on technical skills, tools, and experience"],
  "preferredQualifications": ["3 to 4 bullet points covering preferred or nice-to-have qualifications"],
  "workArrangement": "${job.isRemote ? "Remote" : (job.location || "Hybrid / On-site")}",
  "culture": "Collaborative, innovation-driven culture committed to professional growth and continuous learning.",
  "eeoStatement": "${job.company || "The employer"} is an equal opportunity employer committed to diversity, equity, and inclusion."
}`;

  if (hasApiKey("GEMINI")) {
    const geminiModels = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash"];
    for (const model of geminiModels) {
      try {
        const jsonText = await withApiKey("GEMINI", async (apiKey) => {
          const ai = new GoogleGenAI({ apiKey });
          const resp = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });
          return resp.text || resp.candidates?.[0]?.content?.parts?.[0]?.text;
        });
        if (jsonText) {
          const parsed = JSON.parse(jsonText.trim());
          if (parsed && (parsed.roleSummary || parsed.responsibilities)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`[FullDescriptionService] Gemini (${model}) failed:`, err.message);
      }
    }
  }

  if (hasApiKey("GROQ")) {
    const groqModels = ["openai/gpt-oss-120b", "groq/compound", "llama-3.3-70b-versatile"];
    for (const model of groqModels) {
      try {
        const jsonText = await withApiKey("GROQ", async (apiKey) => {
          const resp = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model,
              messages: [{ role: "user", content: prompt }],
              response_format: { type: "json_object" },
              temperature: 0.2,
            },
            { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, timeout: 10000 }
          );
          return resp.data?.choices?.[0]?.message?.content;
        });
        if (jsonText) {
          const parsed = JSON.parse(jsonText.trim());
          if (parsed && (parsed.roleSummary || parsed.responsibilities)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`[FullDescriptionService] Groq (${model}) failed:`, err.message);
      }
    }
  }

  return null;
}

async function ensureFullJobDescription(job) {
  if (!job) return null;
  const needsRepair = isMisstructuredDescription(job.description);
  if (
    !needsRepair &&
    (job.isFullDescription || !isDescriptionSnippet(job.description))
  ) {
    return job.description;
  }

  let details = null;
  if (job.applyUrl) {
    try {
      details = scrapeExternalPosting(await fetchPosting(job.applyUrl));
    } catch (error) {
      console.warn(
        "[FullDescriptionService] Could not fetch employer posting:",
        error.message,
      );
    }
  }

  if (needsRepair) {
    const savedDetails = readStoredStructuredDetails(job.description);
    details = Object.fromEntries(
      Object.entries(savedDetails).map(([key, value]) => [
        key,
        details?.[key] || value,
      ]),
    );
  }

  let hasEmployerContent =
    details &&
    ((details.description || "").length > 120 ||
      details.responsibilities ||
      details.qualifications ||
      details.skills);

  // If scraping fails (403/captcha/no career posting), expand using AI
  if (!hasEmployerContent) {
    try {
      const aiDetails = await generateDetailsWithAI(job);
      if (aiDetails) {
        details = aiDetails;
        hasEmployerContent = true;
      }
    } catch (aiErr) {
      console.warn("[FullDescriptionService] AI fallback failed:", aiErr.message);
    }
  }

  if (!hasEmployerContent) return job.description;

  const description = buildStructuredDescription(job, details);

  if (job._id) {
    const Job = require("../models/job");
    await Job.findByIdAndUpdate(job._id, {
      description,
      isFullDescription: true,
    });
  }
  return description;
}

module.exports = {
  isDescriptionSnippet,
  ensureFullJobDescription,
  scrapeExternalPosting,
  buildStructuredDescription,
  isMisstructuredDescription,
  generateDetailsWithAI,
};
