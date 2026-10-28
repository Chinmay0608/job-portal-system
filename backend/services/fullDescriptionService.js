const dns = require("node:dns/promises");
const net = require("node:net");
const crypto = require("node:crypto");
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
      "summary",
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
      "what you'll do at figma weave",
      "what you'll do at figma",
      "examples of what you may work on across teams",
      "what you'll be doing",
      "what you'll do",
      "what you will do",
      "in this role you will",
      "duties",
      "essential functions",
    ],
  ],
  [
    "requiredQualifications",
    [
      "we'd love to hear from you if you have",
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
      "what we're looking for",
      "what you'll bring",
      "who you are",
    ],
  ],
  [
    "preferredQualifications",
    [
      "while it's not required, it's an added plus if you also have experience",
      "while it's not required, it's an added plus if you also have",
      "while not required, it's an added plus if you also have",
      "while it's not required, it's a plus if you also have",
      "preferred qualifications",
      "preferred experience",
      "nice to have",
      "nice-to-have",
      "desired qualifications",
      "bonus points",
    ],
  ],
  [
    "compensationBenefits",
    [
      "compensation and benefits",
      "salary and benefits",
      "pay transparency disclosure",
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
    trimmed.endsWith("...") || trimmed.endsWith("\u2026") || trimmed.endsWith("…") ||
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

const ATS_BOARD_CACHE = new Map();
const ATS_CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedBoard(key) {
  const entry = ATS_BOARD_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ATS_CACHE_TTL_MS) {
    ATS_BOARD_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedBoard(key, data) {
  ATS_BOARD_CACHE.set(key, { timestamp: Date.now(), data });
}

function decodeHtmlEntitiesIfNeeded(raw) {
  const str = String(raw || "");
  if (str.includes("&lt;") && !/<(p|div|ul|li|h[1-6]|br)\b/i.test(str)) {
    return cheerio.load(`<div>${str}</div>`)("div").first().text();
  }
  return str;
}

function scoreTitleMatch(expectedTitle, expectedLocation, candidateTitle, candidateLocation) {
  const norm = (v) =>
    String(v || "")
      .toLowerCase()
      .replace(/\+/g, " plus ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const expT = norm(expectedTitle);
  const candT = norm(candidateTitle);
  if (!expT || !candT) return 0;

  let score = 0;
  if (expT === candT) {
    score += 100;
  } else if (candT.startsWith(expT) || expT.startsWith(candT)) {
    score += 75;
  } else {
    const expWords = expT.split(/\s+/).filter((w) => w.length > 1);
    const candWords = new Set(candT.split(/\s+/).filter((w) => w.length > 1));
    const matched = expWords.filter((w) => candWords.has(w)).length;
    if (matched === 0) return 0;
    score += (matched / expWords.length) * 60;
  }

  if (expectedLocation && candidateLocation) {
    const expLoc = norm(expectedLocation).split(/\s+/)[0];
    if (expLoc && norm(candidateLocation).includes(expLoc)) {
      score += 15;
    }
  }
  return score;
}

async function fetchAtsPosting(urlValue, expectedJob = null) {
  let parsedUrl;
  try {
    parsedUrl = new URL(urlValue);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

  // 1. Greenhouse Board API fast-path
  if (
    (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io") &&
    pathParts.length >= 1
  ) {
    const boardToken = pathParts[0].toLowerCase();
    const jobIdFromQuery = parsedUrl.searchParams.get("gh_jid");
    const lastSegment = pathParts[pathParts.length - 1];
    const numericId =
      jobIdFromQuery && /^\d+$/.test(jobIdFromQuery)
        ? jobIdFromQuery
        : pathParts[1] === "jobs" && /^\d+$/.test(lastSegment)
          ? lastSegment
          : null;

    let ghJob = null;
    if (numericId) {
      const response = await axios.get(
        `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${numericId}`,
        { timeout: 4500, validateStatus: (s) => s < 400 },
      );
      ghJob = response.data;
    } else if (expectedJob?.title) {
      const cacheKey = `gh:${boardToken}`;
      let jobs = getCachedBoard(cacheKey);
      if (!jobs) {
        const response = await axios.get(
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`,
          { timeout: 6000, validateStatus: (s) => s < 400 },
        );
        jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
        setCachedBoard(cacheKey, jobs);
      }
      let bestScore = 0;
      for (const candidate of jobs) {
        const s = scoreTitleMatch(
          expectedJob.title,
          expectedJob.location,
          candidate.title,
          candidate.location?.name,
        );
        if (s > bestScore && s >= 45) {
          bestScore = s;
          ghJob = candidate;
        }
      }
    }

    if (ghJob && ghJob.content) {
      const decodedHtml = decodeHtmlEntitiesIfNeeded(ghJob.content);
      const text = descriptionText(decodedHtml);
      if (text.length >= 60) {
        return {
          isJobPosting: true,
          title: asText(ghJob.title) || expectedJob?.title || "",
          company: expectedJob?.company || boardToken,
          description: text.slice(0, 16000),
          responsibilities: "",
          qualifications: "",
          skills: "",
          education: "",
          experience: "",
          preferredQualifications: "",
          compensation: "",
          workArrangement: asText(ghJob.location?.name),
          culture: "",
          resolvedApplyUrl: ghJob.absolute_url || null,
        };
      }
    }
  }

  // 2. Lever Postings API fast-path
  if (host === "jobs.lever.co" && pathParts.length >= 1) {
    const site = pathParts[0].toLowerCase();
    const secondSegment = pathParts[1] || "";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      secondSegment,
    );

    let leverJob = null;
    if (isUuid) {
      const response = await axios.get(
        `https://api.lever.co/v0/postings/${encodeURIComponent(site)}/${secondSegment}?mode=json`,
        { timeout: 4500, validateStatus: (s) => s < 400 },
      );
      leverJob = response.data;
    } else if (expectedJob?.title) {
      const cacheKey = `lever:${site}`;
      let postings = getCachedBoard(cacheKey);
      if (!postings) {
        const response = await axios.get(
          `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`,
          { timeout: 6500, validateStatus: (s) => s < 400 },
        );
        postings = Array.isArray(response.data) ? response.data : [];
        setCachedBoard(cacheKey, postings);
      }
      let bestScore = 0;
      for (const candidate of postings) {
        const s = scoreTitleMatch(
          expectedJob.title,
          expectedJob.location,
          candidate.text,
          candidate.categories?.location,
        );
        if (s > bestScore && s >= 45) {
          bestScore = s;
          leverJob = candidate;
        }
      }
    }

    if (leverJob && (leverJob.description || leverJob.descriptionPlain)) {
      const listsHtml = Array.isArray(leverJob.lists)
        ? leverJob.lists
            .map((l) => `<h3>${l.text || ""}</h3><ul>${l.content || ""}</ul>`)
            .join("\n")
        : "";
      const combinedHtml = [
        leverJob.description || "",
        listsHtml,
        leverJob.additional || "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const text = descriptionText(combinedHtml);
      if (text.length >= 60) {
        return {
          isJobPosting: true,
          title: asText(leverJob.text) || expectedJob?.title || "",
          company: expectedJob?.company || site,
          description: text.slice(0, 16000),
          responsibilities: "",
          qualifications: "",
          skills: "",
          education: "",
          experience: "",
          preferredQualifications: "",
          compensation: "",
          workArrangement: [
            asText(leverJob.categories?.location),
            asText(leverJob.categories?.commitment),
            asText(leverJob.workplaceType),
          ]
            .filter(Boolean)
            .join(". "),
          culture: "",
          resolvedApplyUrl: leverJob.hostedUrl || null,
        };
      }
    }
  }

  return null;
}

async function fetchPosting(urlValue) {
  let currentUrl = urlValue;

  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const { url, addresses } = await resolvePublicUrl(currentUrl);
    const addressByFamily = new Map(
      addresses.map(({ address, family }) => [family, address]),
    );
    const response = await axios.get(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobPortal/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 4500,
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
      if (!location || redirects === 3)
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
        .join("\u2013");
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
    $(item).replaceWith(`\n\u2022 ${$(item).text()}\n`);
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
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
  const headings = [...DESCRIPTION_HEADINGS].sort(
    (a, b) => b.heading.length - a.heading.length,
  );
  const escapedHeadings = headings
    .map(({ heading }) => heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const pattern = new RegExp(`(^|\\s)(${escapedHeadings})\\s*:?\\s*`, "gi");
  const sections = {};
  const isValidHeadingMatch = (m) => {
    const matchedHeadingText = m[2];
    const fullMatchText = m[0];
    const isSingleWord = !/\s/.test(matchedHeadingText.trim());
    const startsOnNewLine = m.index === 0 || /\n/.test(m[1]);
    const hasColon = /:/.test(fullMatchText);
    const hasTrailingNewline = /\n/.test(
      fullMatchText.slice(m[1].length + matchedHeadingText.length),
    );
    const afterMatchChar = text.slice(m.index + fullMatchText.length, m.index + fullMatchText.length + 1);
    if (!hasColon && /^[,.;)]/.test(afterMatchChar)) {
      return false;
    }
    if (isSingleWord) {
      return hasColon || (startsOnNewLine && hasTrailingNewline);
    }
    return (
      hasColon ||
      startsOnNewLine ||
      (/^[A-Z]/.test(matchedHeadingText.trim()) && !/^[a-z]/.test(afterMatchChar))
    );
  };

  const validMatches = [...text.matchAll(pattern)].filter(isValidHeadingMatch);
  if (!validMatches.length)
    return { hasHeadings: false, sections: { roleSummary: text } };

  const leadingSummary = text.slice(0, validMatches[0].index).trim();
  if (leadingSummary && !/^required$/i.test(leadingSummary)) {
    sections.roleSummary = leadingSummary;
  }

  for (let index = 0; index < validMatches.length; index += 1) {
    const match = validMatches[index];
    const matchedHeadingText = match[2];
    const heading = headings.find(
      (item) => item.heading.toLowerCase() === matchedHeadingText.toLowerCase(),
    );
    const start = match.index + match[0].length;
    const end = validMatches[index + 1]?.index ?? text.length;
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
  const raw = String(description || "");
  if (
    /\$(?:undefined|null)\b/i.test(raw) ||
    /is hiring for [\s\S]{1,120}? in the [\s\S]{1,60}? space\./i.test(raw) ||
    /Use the Apply button to open the employer's official application page\./i.test(raw)
  ) {
    return true;
  }
  const $ = cheerio.load(raw);
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

function toList(value) {
  if (!value) return [];
  const items = (Array.isArray(value) ? value : [value])
    .flatMap((entry) =>
      entry == null
        ? []
        : String(entry).split(/\n+|(?<=[.!?])\s+|;\s+|[\u2022\u25cf\u25aa\u2043\u2219•●▪]\s*/),
    )
    .map((item) => item.replace(/^\s*[-*\u2022\u25cf\u25aa\u2043\u2219]\s*/, "").trim())
    .filter(
      (item) =>
        item &&
        !/^(?:undefined|null|not specified in the employer posting\.?|n\/a)$/i.test(
          item,
        ),
    );
  return [...new Set(items)];
}

function findZohoRecruitPosting($, html) {
  const match = String(html || "").match(/var\s+jobs\s*=\s*JSON\.parse\('((?:\\'|[^'])+)'\)/);
  if (!match) return null;
  try {
    const decoded = match[1]
      .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\-/g, "-")
      .replace(/\\\//g, "/")
      .replace(/\\\\/g, "\\");
    const jobs = JSON.parse(decoded);
    const zohoJob = Array.isArray(jobs) ? jobs[0] : jobs;
    if (!zohoJob || typeof zohoJob !== "object") return null;
    const pageTitle = $("meta[property='og:title']").attr("content") || $("title").text() || "";
    const companyFromTitle = pageTitle.includes(" - ") ? pageTitle.split(" - ")[0].trim() : "";
    return {
      "@type": "JobPosting",
      title: zohoJob.Posting_Title || zohoJob.Job_Opening_Name,
      hiringOrganization: {
        name: zohoJob.Account_Name?.name || zohoJob.Company || companyFromTitle,
      },
      description: zohoJob.Job_Description,
      experienceRequirements: zohoJob.Work_Experience,
      employmentType: zohoJob.Job_Type,
      jobLocationType: zohoJob.Remote_Job ? "Remote" : "",
      jobLocation: [zohoJob.City, zohoJob.State, zohoJob.Country].filter(Boolean).join(", "),
      baseSalary: zohoJob.Salary,
      industry: zohoJob.Industry,
    };
  } catch {
    return null;
  }
}

function scrapeExternalPosting(html, expectedJob = null) {
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
  if (!posting) {
    posting = findZohoRecruitPosting($, html);
  }

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

  const result = {
    isJobPosting: Boolean(posting),
    title: asText(posting?.title),
    company: asText(posting?.hiringOrganization?.name),
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

  if (result.isJobPosting || !expectedJob?.title) return result;

  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const expectedTitle = normalize(expectedJob.title);
  let tableListing = null;
  $("tr").each((_, row) => {
    if (tableListing) return;
    const cells = $(row).children("th, td").map((__, cell) => descriptionText($(cell).html() || "")).get();
    if (cells.length < 2 || normalize(cells[0]) !== expectedTitle) return;
    const headers = $(row).closest("table").find("tr").first().children("th, td").map((__, cell) => descriptionText($(cell).html() || "")).get();
    const fields = cells.map((value, index) => `${headers[index] || (index === 0 ? "Role" : `Detail ${index}`)}: ${value}`);
    tableListing = { title: cells[0], description: fields.join("\n") };
  });

  return tableListing
    ? { ...result, isJobPosting: true, isTableListing: true, title: tableListing.title, company: expectedJob.company || "", description: tableListing.description }
    : result;
}

function isReferralAlertDescription(description) {
  return /\breferral\s+alert\s*:/i.test(String(description || "").replace(/<[^>]*>/g, " "));
}

function matchesJobPosting(job, details) {
  if (!details?.isJobPosting || !details.title || !details.description) return false;

  const words = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !["and", "the", "for", "with"].includes(word));
  const expectedTitle = words(job.title);
  const actualTitle = new Set(words(details.title));
  const titleMatches = expectedTitle.filter((word) => actualTitle.has(word)).length;
  const requiredTitleMatches = expectedTitle.length > 3 ? 2 : 1;
  if (titleMatches < requiredTitleMatches) return false;

  if (job.company && details.company) {
    const expectedCompany = words(job.company);
    const actualCompany = new Set(words(details.company));
    if (!expectedCompany.some((word) => actualCompany.has(word))) return false;
  }
  return details.description.length >= 60;
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

async function translateDescriptionToEnglish(description) {
  if (!hasApiKey("GEMINI") && !hasApiKey("GROQ")) return null;
  const prompt = `Translate the following job description into clear English. If it is already English, return it unchanged. Preserve all facts, names, numbers, links, HTML tags, and list structure. Do not summarize, add, or remove content. Return only the translated description.\n\n${description}`;

  if (hasApiKey("GEMINI")) {
    for (const model of ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"]) {
      try {
        const result = await withApiKey("GEMINI", async (apiKey) => {
          const response = await new GoogleGenAI({ apiKey }).models.generateContent({
            model,
            contents: prompt,
            config: { temperature: 0.1 },
          });
          return response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        });
        if (result?.trim()) return result.trim();
      } catch (error) {
        console.warn(`[FullDescriptionService] Gemini translation (${model}) failed:`, error.message);
      }
    }
  }

  if (hasApiKey("GROQ")) {
    for (const model of ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]) {
      try {
        const result = await withApiKey("GROQ", async (apiKey) => {
          const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model,
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
            },
            { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 20000 },
          );
          return response.data?.choices?.[0]?.message?.content?.trim() || null;
        });
        if (result) return result;
      } catch (error) {
        console.warn(`[FullDescriptionService] Groq translation (${model}) failed:`, error.message);
      }
    }
  }
  return null;
}

function isDescriptionInEnglish(text) {
  if (!text) return true;
  const stripped = String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
  if (stripped.length < 20) return true;

  const nonLatinMatches = stripped.match(/[^\u0020-\u024F\s\d.,!?'"()\-:;/@%&*+=#$€£₹[\]{}<>]/g);
  const totalLetters = (stripped.match(/[\p{L}]/gu) || []).length;
  if (totalLetters > 0 && nonLatinMatches && (nonLatinMatches.length / totalLetters) > 0.15) {
    return false;
  }

  const englishTokens = new Set([
    "the", "and", "to", "of", "in", "for", "is", "with", "that", "you", "your",
    "will", "are", "be", "as", "at", "this", "have", "from", "or", "an", "we",
    "our", "work", "team", "experience", "skills", "role", "requirements", "job"
  ]);

  const words = stripped.toLowerCase().match(/\b[a-z]{2,}\b/g) || [];
  if (words.length < 5) return true;

  let englishCount = 0;
  for (const word of words) {
    if (englishTokens.has(word)) englishCount++;
  }

  const uniqueEnglishWords = new Set(words.filter(w => englishTokens.has(w))).size;
  return uniqueEnglishWords >= 3 || (englishCount / words.length) >= 0.08;
}

async function ensureEnglishDescription(job) {
  if (!job?.description) return null;
  if (isDescriptionInEnglish(job.description)) {
    return job.description;
  }
  const hash = crypto.createHash("sha256").update("translation-v2:").update(job.description).digest("hex");
  if (job.descriptionEnglishSourceHash === hash && job.descriptionEnglish) {
    return job.descriptionEnglish;
  }
  const translated = await translateDescriptionToEnglish(job.description);
  if (!translated) return null;
  job.descriptionEnglish = translated;
  job.descriptionEnglishSourceHash = hash;
  await job.save();
  return translated;
}

async function ensureFullJobDescription(job) {
  if (!job) return null;
  const referralAlert = isReferralAlertDescription(job.description);
  const needsRepair = isMisstructuredDescription(job.description) || referralAlert;
  if (
    !needsRepair &&
    !isDescriptionSnippet(job.description)
  ) {
    return job.description;
  }

  let details = null;
  const sourceUrl = job.descriptionSourceUrl || job.applyUrl;
  if (sourceUrl) {
    try {
      details = await fetchAtsPosting(sourceUrl, job);
      if (!details) {
        details = scrapeExternalPosting(
          await fetchPosting(sourceUrl),
          job,
        );
      }
    } catch (error) {
      console.warn(
        "[FullDescriptionService] Could not fetch employer posting:",
        error.message,
      );
    }
  }

  const verifiedPosting = matchesJobPosting(job, details);
  if (referralAlert) {
    if (!verifiedPosting) return null;
    const description = details.description;
    if (job._id) {
      const Job = require("../models/job");
      const updateDoc = { description, isFullDescription: true };
      if (details.resolvedApplyUrl) updateDoc.applyUrl = details.resolvedApplyUrl;
      await Job.findByIdAndUpdate(job._id, updateDoc);
    }
    return description;
  }

  if (!verifiedPosting) return job.description;

  const description = details.isTableListing
    ? details.description
    : buildStructuredDescription(job, details);

  if (job._id) {
    const Job = require("../models/job");
    const updateDoc = {
      description,
      isFullDescription: !isDescriptionSnippet(description),
    };
    if (details.resolvedApplyUrl) updateDoc.applyUrl = details.resolvedApplyUrl;
    await Job.findByIdAndUpdate(job._id, updateDoc);
  }
  return description;
}

module.exports = {
  isDescriptionSnippet,
  isReferralAlertDescription,
  ensureFullJobDescription,
  fetchAtsPosting,
  scrapeExternalPosting,
  buildStructuredDescription,
  isMisstructuredDescription,
  ensureEnglishDescription,
};
