const User = require("../models/user");
const Job = require("../models/job");
const sendEmail = require("../utils/sendEmail");
const { calculateJobMatches } = require("./jobMatchService");

const MIN_MATCH_PERCENTAGE = 40; // only notify about reasonably relevant matches
const MAX_JOBS_PER_EMAIL = 5;

const buildDigestHtml = (userName, jobs) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";

  const jobRows = jobs
    .map(
      (job) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>${job.title}</strong> at ${job.company}<br/>
            <span style="color: #666; font-size: 13px;">${job.location || "Remote"} • ${job.matchPercentage}% match</span><br/>
            <a href="${job.applyUrl || `${frontendUrl}/jobs/${job._id}`}" style="color: #E8404A; text-decoration: none; font-weight: bold;">View & Apply →</a>
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #333; line-height: 1.5;">
      <h2 style="color: #111827;">Hi ${userName || "there"}, we found some jobs for you</h2>
      <p style="font-size: 15px;">Here are ${jobs.length} new job${jobs.length > 1 ? "s" : ""} matching your profile on SkillBridge:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">${jobRows}</table>
      <p style="margin-top: 24px; font-size: 13px; color: #888; border-top: 1px solid #eee; padding-top: 16px;">
        You're receiving this because email notifications are enabled on your SkillBridge account.
        <a href="${frontendUrl}/candidate-profile" style="color: #2563eb;">Manage preferences</a>.
      </p>
    </div>
  `;
};

const runJobDigest = async () => {
  console.log("[Job Digest] Starting run at", new Date().toISOString());

  const candidates = await User.find({
    role: "candidate",
    emailNotificationsEnabled: { $ne: false },
    skills: { $exists: true, $ne: [] },
  });

  let emailsSent = 0;

  for (const candidate of candidates) {
    const sinceDate = candidate.lastJobDigestSentAt || new Date(0);

    const newJobs = await Job.find({
      isActive: { $ne: false },
      createdAt: { $gt: sinceDate },
    });

    if (newJobs.length === 0) continue;

    const candidateProfile = {
      skills: candidate.skills || [],
      field: candidate.field || "Software Engineering",
    };

    const matched = calculateJobMatches(newJobs, candidateProfile, true)
      .filter((job) => job.matchPercentage >= MIN_MATCH_PERCENTAGE)
      .slice(0, MAX_JOBS_PER_EMAIL);

    if (matched.length === 0) {
      candidate.lastJobDigestSentAt = new Date();
      await candidate.save();
      continue;
    }

    const html = buildDigestHtml(candidate.name, matched);
    await sendEmail(candidate.email, `${matched.length} new job${matched.length > 1 ? "s" : ""} matching your profile`, html);

    candidate.lastJobDigestSentAt = new Date();
    await candidate.save();
    emailsSent++;
  }

  console.log(`[Job Digest] Run complete. Sent ${emailsSent} emails out of ${candidates.length} eligible candidates.`);
  return { candidatesCount: candidates.length, emailsSent };
};

module.exports = { runJobDigest, buildDigestHtml };
