#!/usr/bin/env node
/**
 * pagespeed_log.js
 * ---------------------------------------------------------
 * Runs a Google PageSpeed Insights scan against a URL and
 * saves the results as both a JSON log and a human-readable
 * .txt log, timestamped, so you have a permanent record you
 * can diff over time instead of re-reading the website.
 *
 * Usage:
 *   node pagespeed_log.js https://job-portal-system-alpha.vercel.app/
 *   node pagespeed_log.js https://job-portal-system-alpha.vercel.app/ mobile
 *
 * (strategy defaults to "desktop" if not given; pass "mobile" for mobile)
 *
 * Optional: set a free Google API key as an env var to avoid
 * strict rate limits (get one at https://developers.google.com/speed/docs/insights/v5/get-started):
 *   PAGESPEED_API_KEY=your_key node pagespeed_log.js <url>
 * ---------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const url = process.argv[2];
const strategy = process.argv[3] === "mobile" ? "mobile" : "desktop";
const apiKey = process.env.PAGESPEED_API_KEY || "";

if (!url) {
  console.error("Usage: node pagespeed_log.js <url> [mobile|desktop]");
  process.exit(1);
}

const categories = ["performance", "accessibility", "best-practices", "seo"];
const catParams = categories.map((c) => `category=${c}`).join("&");

const apiUrl =
  `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
  `?url=${encodeURIComponent(url)}` +
  `&strategy=${strategy}` +
  `&${catParams}` +
  (apiKey ? `&key=${apiKey}` : "");

console.log(`Fetching PageSpeed report for: ${url} (${strategy})...`);

https
  .get(apiUrl, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      if (res.statusCode !== 200) {
        console.error(`Request failed: ${res.statusCode}`);
        console.error(data);
        process.exit(1);
      }

      const json = JSON.parse(data);
      writeLogs(json);
    });
  })
  .on("error", (err) => {
    console.error("Request error:", err.message);
    process.exit(1);
  });

function writeLogs(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(process.cwd(), "pagespeed-logs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const jsonPath = path.join(outDir, `pagespeed_${strategy}_${timestamp}.json`);
  const txtPath = path.join(outDir, `pagespeed_${strategy}_${timestamp}.txt`);

  // Full raw JSON — useful for diffing between runs or feeding to another tool
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  // Human-readable summary log
  const lighthouse = report.lighthouseResult;
  const categoriesResult = lighthouse.categories;

  let lines = [];
  lines.push(`PageSpeed Insights Report`);
  lines.push(`URL: ${report.id}`);
  lines.push(`Strategy: ${strategy}`);
  lines.push(`Timestamp: ${new Date().toString()}`);
  lines.push(`Lighthouse version: ${lighthouse.lighthouseVersion}`);
  lines.push("");
  lines.push(`=== SCORES ===`);
  for (const key of Object.keys(categoriesResult)) {
    const cat = categoriesResult[key];
    const score = Math.round(cat.score * 100);
    lines.push(`${cat.title}: ${score}/100`);
  }
  lines.push("");

  lines.push(`=== FAILING / WARNING AUDITS ===`);
  const audits = lighthouse.audits;
  for (const key of Object.keys(audits)) {
    const audit = audits[key];
    // Only include audits that have a numeric score and aren't a perfect pass
    if (typeof audit.score === "number" && audit.score < 1) {
      lines.push(`- [${key}] ${audit.title}`);
      if (audit.description) {
        lines.push(`    ${audit.description.replace(/\n/g, " ")}`);
      }
      if (audit.displayValue) {
        lines.push(`    Value: ${audit.displayValue}`);
      }
      lines.push("");
    }
  }

  fs.writeFileSync(txtPath, lines.join("\n"), "utf8");

  console.log(`\nDone. Logs written to:`);
  console.log(`  ${jsonPath}  (full raw data)`);
  console.log(`  ${txtPath}  (readable summary + failing audits)`);
}
