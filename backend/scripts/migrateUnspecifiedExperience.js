require("dotenv").config({ quiet: true });
const connectDB = require("../config/db");
const Job = require("../models/job");
const { getExplicitExperienceBuckets } = require("../services/sde/SyncAdapter");

const inferExperienceFromDescription = (description) => {
  const text = String(description || "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(?:43|x2b);/gi, "+")
    .replace(/<br\s*\/?\s*>|<\/(?:p|li|h[1-6]|div|tr|section)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ");
  const candidates = [];
  const pattern = /\b(\d+(?:\.\d+)?)\s*(?:\+|(?:-|\u2013|to)\s*(\d+(?:\.\d+)?)\+?)?\s*years?\b/gi;

  for (const match of text.matchAll(pattern)) {
    const context = text.slice(Math.max(0, match.index - 120), match.index + match[0].length + 120);
    const required = /experience|required|minimum|at least|must have/i.test(context);
    const preferredOnly = /preferred|nice to have|bonus/i.test(context) && !/required|minimum|must have/i.test(context);
    if (!required || preferredOnly) continue;
    candidates.push({ minimum: Number(match[1]), maximum: Number(match[2]) });
  }

  if (!candidates.length) return null;
  const minimum = Math.min(...candidates.map(({ minimum }) => minimum));
  const maximum = Math.max(...candidates.filter(({ minimum: value }) => value === minimum).map(({ maximum }) => maximum || 0));
  if (minimum >= 5) return "5+ Years";
  if (minimum >= 3 || (minimum === 2 && maximum >= 3)) return "2-5 Years";
  return "0-2 Years";
};

const run = async () => {
  const apply = process.argv.includes("--apply");
  await connectDB();

  let checked = 0;
  let matched = 0;
  const examples = [];
  let operations = [];
  console.log(`Scanning unspecified postings (${apply ? "apply" : "preview"} mode)...`);

  const cursor = Job.find({ experienceRequired: "Not Specified" })
    .select("title company source description")
    .lean()
    .cursor({ batchSize: 250 });
  for await (const job of cursor) {
    checked++;
    const buckets = getExplicitExperienceBuckets(job.description);
    const experienceRequired = buckets.length === 1
      ? buckets[0]
      : inferExperienceFromDescription(job.description);
    if (!experienceRequired) continue;
    matched++;
    if (examples.length < 30) examples.push({
      title: job.title,
      company: job.company,
      source: job.source,
      experienceRequired,
    });
    if (apply) {
      operations.push({
        updateOne: {
          filter: { _id: job._id, experienceRequired: "Not Specified" },
          update: { $set: { experienceRequired } },
        },
      });
      if (operations.length === 500) {
        await Job.bulkWrite(operations, { ordered: false });
        operations = [];
      }
    }
  }
  if (operations.length) await Job.bulkWrite(operations, { ordered: false });

  console.log(JSON.stringify({
    mode: apply ? "apply" : "preview",
    unspecifiedJobsChecked: checked,
    clearExperienceMatches: matched,
    updated: apply ? matched : 0,
    examples,
  }, null, 2));
};

run()
  .catch((error) => {
    console.error("Experience migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
