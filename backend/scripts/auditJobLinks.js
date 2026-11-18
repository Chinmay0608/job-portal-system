require("dotenv").config({ quiet: true });

const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Job = require("../models/job");
const { resolvePublicUrl } = require("../services/fullDescriptionService");

const DEFAULT_DELAY_MS = 1000;
const DEFAULT_CONCURRENCY = 8;
const MAX_CONCURRENCY = 20;
const MAX_REDIRECTS = 5;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;
const CLOSED_MESSAGE =
  /\b(?:this\s+)?(?:job|position|role|listing|vacancy|requisition)\s+(?:posting\s+)?(?:is\s+)?(?:no\s+longer\s+available|has\s+been\s+filled|is\s+filled|has\s+expired|is\s+expired|is\s+closed|was\s+closed|no\s+longer\s+accepting\s+applications)\b|\bno\s+longer\s+accepting\s+applications\b|\bapplications?\s+(?:are\s+)?closed\b|\bjob\s+not\s+found\b/i;

const hostTails = new Map();
const hostLastRequestAt = new Map();

const normalize = (text) =>
  String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function isMatchingJobPage(pageText, title) {
  const expected = normalize(title);
  if (!expected) return false;
  const normalizedPage = normalize(pageText);
  if (normalizedPage.includes(expected)) return true;

  const tokens = expected.split(/\s+/).filter((word) => word.length > 2);
  return (
    tokens.length > 1 &&
    tokens.filter((word) => normalizedPage.includes(word)).length /
      tokens.length >=
      0.8
  );
}

function classifyResponse({ status, html, title, titles = [] }) {
  if (status === 404 || status === 410) {
    return { verdict: "stale", reason: `http_${status}` };
  }
  if (status < 200 || status >= 300) {
    return { verdict: "inconclusive", reason: `http_${status}` };
  }

  const $ = cheerio.load(html || "");
  const pageText = $("body").text().replace(/\s+/g, " ").trim();
  if (!pageText || !CLOSED_MESSAGE.test(pageText)) {
    return { verdict: "not_confirmed_stale", reason: "no_closed_marker" };
  }
  const pageIdentity = `${$("title").text()} ${pageText}`;
  if (
    ![title, ...titles].some((jobTitle) =>
      isMatchingJobPage(pageIdentity, jobTitle),
    )
  ) {
    return {
      verdict: "inconclusive",
      reason: "closed_marker_job_identity_unconfirmed",
    };
  }
  return { verdict: "stale", reason: "matching_job_closed_message" };
}

async function withHostLimit(host, delayMs, request) {
  const previous = hostTails.get(host) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  hostTails.set(host, current);
  await previous;
  try {
    const wait = Math.max(
      0,
      delayMs - (Date.now() - (hostLastRequestAt.get(host) || 0)),
    );
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    hostLastRequestAt.set(host, Date.now());
    return await request();
  } finally {
    release();
    if (hostTails.get(host) === current) hostTails.delete(host);
  }
}

async function requestUrl(value, delayMs) {
  let currentUrl = value;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const { url, addresses } = await resolvePublicUrl(currentUrl);
    const addressByFamily = new Map(
      addresses.map(({ address, family }) => [family, address]),
    );
    const response = await withHostLimit(url.hostname, delayMs, () =>
      axios.get(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SkillBridgeJobAudit/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: 10000,
        maxRedirects: 0,
        maxContentLength: 2_000_000,
        responseType: "text",
        validateStatus: () => true,
        lookup: (_hostname, options, callback) => {
          if (options?.all) {
            callback(null, addresses);
            return;
          }
          const address =
            addressByFamily.get(options?.family) || addresses[0].address;
          callback(null, address, net.isIP(address));
        },
      }),
    );

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location)
        return { status: response.status, finalUrl: url.href, html: "" };
      if (redirects === MAX_REDIRECTS) {
        return {
          status: response.status,
          finalUrl: url.href,
          reason: "redirect_limit",
        };
      }
      currentUrl = new URL(location, url).href;
      continue;
    }

    return {
      status: response.status,
      finalUrl: url.href,
      html: typeof response.data === "string" ? response.data : "",
    };
  }
}

async function checkUrl(url, jobs, delayMs) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await requestUrl(url, delayMs);
      if (
        attempt < MAX_ATTEMPTS &&
        (response.status === 408 ||
          response.status === 429 ||
          response.status >= 500)
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attempt),
        );
        continue;
      }
      const result = classifyResponse({
        status: response.status,
        html: response.html,
        titles: jobs.map((job) => job.title),
      });
      return {
        ...result,
        status: response.status,
        finalUrl: response.finalUrl,
      };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * attempt),
        );
      }
    }
  }
  return {
    verdict: "inconclusive",
    reason: lastError?.code || lastError?.message || "request_failed",
    status: 0,
    finalUrl: url,
  };
}

function parseArgs(args) {
  const options = {
    concurrency: DEFAULT_CONCURRENCY,
    delayMs: DEFAULT_DELAY_MS,
    limit: 0,
    output: "",
  };
  for (const arg of args) {
    if (arg.startsWith("--delay-ms=")) options.delayMs = Number(arg.slice(11));
    else if (arg.startsWith("--concurrency=")) {
      options.concurrency = Number(arg.slice(14));
    } else if (arg.startsWith("--limit=")) options.limit = Number(arg.slice(8));
    else if (arg.startsWith("--output=")) options.output = arg.slice(9);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.delayMs) || options.delayMs < 0) {
    throw new Error("--delay-ms must be a non-negative integer");
  }
  if (!Number.isInteger(options.limit) || options.limit < 0) {
    throw new Error("--limit must be a non-negative integer");
  }
  if (
    !Number.isInteger(options.concurrency) ||
    options.concurrency < 1 ||
    options.concurrency > MAX_CONCURRENCY
  ) {
    throw new Error(
      `--concurrency must be an integer from 1 to ${MAX_CONCURRENCY}`,
    );
  }
  if (!options.output) throw new Error("--output=<jsonl path> is required");
  return options;
}

function getNextAlertAt(checkedUrls) {
  return (Math.floor(checkedUrls / 500) + 1) * 500;
}

function makeSummary(
  results,
  totalJobs,
  totalUrls,
  outputPath,
  withoutHttpLink,
) {
  const counts = {
    stale: 0,
    not_confirmed_stale: 0,
    inconclusive: 0,
    checkedUrls: results.length,
    checkedJobRecords: results.reduce(
      (sum, result) => sum + result.jobs.length,
      0,
    ),
    totalJobRecords: totalJobs,
    totalUniqueLinks: totalUrls,
    withoutHttpLink,
    remainingUniqueLinks: totalUrls - results.length,
  };
  for (const result of results) counts[result.verdict] += result.jobs.length;
  return {
    ...counts,
    completedAt: new Date().toISOString(),
    findingsFile: outputPath,
  };
}

function readAuditRows(outputPath) {
  if (!fs.existsSync(outputPath)) return [];
  return fs
    .readFileSync(outputPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

async function writeSummary(outputPath, summary) {
  const summaryPath = `${outputPath}.summary.json`;
  const temporaryPath = `${summaryPath}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporaryPath, JSON.stringify(summary, null, 2));
  await fs.promises.rename(temporaryPath, summaryPath);
}

async function runAudit({ concurrency, delayMs, limit, output }) {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("No MongoDB URI is configured");
  const outputPath = path.resolve(output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const existingResults = readAuditRows(outputPath);
  const existingByUrl = new Map(
    existingResults
      .filter((row) => row.url && row.checkedAt)
      .map((row) => [row.url, row]),
  );
  const completed = new Set(existingByUrl.keys());

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    readPreference: "secondaryPreferred",
  });
  try {
    const jobs = await Job.find()
      .select("_id title company applyUrl descriptionSourceUrl")
      .lean();
    const jobsByUrl = new Map();
    let withoutHttpLink = 0;
    for (const job of jobs) {
      const rawUrl = String(
        job.descriptionSourceUrl || job.applyUrl || "",
      ).trim();
      try {
        const url = new URL(rawUrl);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password
        ) {
          withoutHttpLink += 1;
          continue;
        }
        if (!jobsByUrl.has(url.href)) jobsByUrl.set(url.href, []);
        jobsByUrl.get(url.href).push({
          jobId: String(job._id),
          title: job.title,
          company: job.company,
        });
      } catch {
        withoutHttpLink += 1;
      }
    }

    let pending = [...jobsByUrl].filter(([url]) => !completed.has(url));
    const totalUrls = jobsByUrl.size;
    if (limit) pending = pending.slice(0, limit);
    const savedResults = [...existingByUrl.values()];
    const checkpoint = makeSummary(
      savedResults,
      jobs.length,
      totalUrls,
      outputPath,
      withoutHttpLink,
    );
    await writeSummary(outputPath, checkpoint);
    console.log(
      JSON.stringify({ resumedFrom: checkpoint.checkedUrls, ...checkpoint }),
    );
    const outputStream = fs.createWriteStream(outputPath, { flags: "a" });
    const results = [];
    let nextAlertAt = getNextAlertAt(completed.size);
    let nextIndex = 0;
    let writeChain = Promise.resolve();
    const recordResult = (row) => {
      results.push(row);
      writeChain = writeChain.then(
        () =>
          new Promise((resolve, reject) => {
            outputStream.write(`${JSON.stringify(row)}\n`, (error) =>
              error ? reject(error) : resolve(),
            );
          }),
      );
      if (results.length % 25 === 0 || results.length === pending.length) {
        const summary = makeSummary(
          [...savedResults, ...results],
          jobs.length,
          totalUrls,
          outputPath,
          withoutHttpLink,
        );
        writeChain = writeChain.then(() => writeSummary(outputPath, summary));
        console.log(
          JSON.stringify({
            processedThisRun: results.length,
            percentComplete: Number(
              ((summary.checkedUrls / totalUrls) * 100).toFixed(2),
            ),
            ...summary,
          }),
        );
      }
      const checkedUrls = completed.size + results.length;
      while (checkedUrls >= nextAlertAt) {
        const summary = makeSummary(
          [...savedResults, ...results],
          jobs.length,
          totalUrls,
          outputPath,
          withoutHttpLink,
        );
        console.log(
          `AUDIT ALERT: ${nextAlertAt}/${totalUrls} unique links checked; ` +
            `${summary.stale} job records confirmed stale; ` +
            `${summary.inconclusive} inconclusive. No deletions have been made.`,
        );
        nextAlertAt += 500;
      }
      return writeChain;
    };
    const pendingByHost = new Map();
    for (const entry of pending) {
      const host = new URL(entry[0]).hostname;
      if (!pendingByHost.has(host)) pendingByHost.set(host, []);
      pendingByHost.get(host).push(entry);
    }
    const hostGroups = [...pendingByHost.values()];
    const worker = async () => {
      while (nextIndex < hostGroups.length) {
        const hostEntries = hostGroups[nextIndex++];
        for (const [url, linkedJobs] of hostEntries) {
          const result = await checkUrl(url, linkedJobs, delayMs);
          await recordResult({
            url,
            jobs: linkedJobs,
            checkedAt: new Date().toISOString(),
            ...result,
          });
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, hostGroups.length) }, worker),
    );
    await writeChain;
    await new Promise((resolve, reject) =>
      outputStream.end((error) => (error ? reject(error) : resolve())),
    );
    if (results.length === 0) {
      console.log(
        JSON.stringify({
          processedThisRun: 0,
          totalJobRecords: jobs.length,
          uniqueLinks: jobsByUrl.size,
          withoutHttpLink,
          percentComplete: Number(
            ((completed.size / jobsByUrl.size) * 100).toFixed(2),
          ),
          message: "No pending URLs. Existing audit results were resumed.",
        }),
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runAudit(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error(`Job link audit failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  classifyResponse,
  getNextAlertAt,
  isMatchingJobPage,
  makeSummary,
  parseArgs,
};
