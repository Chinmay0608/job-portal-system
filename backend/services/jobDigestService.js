const User = require("../models/user");
const Job = require("../models/job");
const sendEmail = require("../utils/sendEmail");
const { calculateJobMatches } = require("./jobMatchService");
const { resolveCompanyLogo } = require("../utils/companyLogoHelper");

const MIN_MATCH_PERCENTAGE = 40; // only notify about reasonably relevant matches
const MAX_JOBS_PER_EMAIL = 5;

/**
 * Builds a modern, responsive LinkedIn-style Job Alert HTML email
 */
const buildDigestHtml = (userName, jobs, recipientEmail = "", targetField = "Software Engineer") => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://skillbridge.careers";

  const jobRowsHtml = jobs
    .map((job, index) => {
      const logoUrl = resolveCompanyLogo(job.company, job.companyLogo);
      const isLast = index === jobs.length - 1;
      const borderStyle = isLast ? "" : "border-bottom: 1px solid #f3f2ef;";
      const jobUrl = job.applyUrl || `${frontendUrl}/candidate-dashboard?jobId=${job._id || ""}`;

      const logoCell = logoUrl
        ? `<img src="${logoUrl}" alt="${job.company}" width="48" height="48" style="width: 48px; height: 48px; object-fit: contain; border-radius: 6px; border: 1px solid #e0dfdc; display: block; background-color: #ffffff;" />`
        : `<table width="48" height="48" cellpadding="0" cellspacing="0" border="0" style="width: 48px; height: 48px; border-radius: 6px; background-color: #f3f2ef; border: 1px solid #e0dfdc; text-align: center;"><tr><td align="center" style="font-size: 18px; font-weight: 700; color: #0a66c2;">${(job.company || "S").slice(0, 1).toUpperCase()}</td></tr></table>`;

      return `
        <tr>
          <td style="padding: 16px 0; ${borderStyle}">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Company Logo Column -->
                <td width="48" style="width: 48px; vertical-align: top; padding-right: 14px;">
                  <a href="${jobUrl}" style="text-decoration: none; display: block;">
                    ${logoCell}
                  </a>
                </td>
                <!-- Job Details Column -->
                <td style="vertical-align: top;">
                  <a href="${jobUrl}" style="font-size: 15px; font-weight: 600; color: #0a66c2; text-decoration: none; display: block; line-height: 1.35; margin-bottom: 3px;">
                    ${job.title}
                  </a>
                  <div style="font-size: 13px; color: rgba(0,0,0,0.6); margin-bottom: 4px; line-height: 1.4;">
                    ${job.company} · ${job.location || "Remote, India"}${job.employmentType ? ` (${job.employmentType})` : ""}
                  </div>
                  ${job.salary ? `<div style="font-size: 12px; font-weight: 600; color: rgba(0,0,0,0.8); margin-bottom: 5px;">${job.salary}</div>` : ""}
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="vertical-align: middle;">
                        <!-- Easy Apply Badge -->
                        <span style="font-size: 12px; font-weight: 600; color: #0a66c2; display: inline-flex; align-items: center;">
                          ⚡ Easy Apply
                        </span>
                      </td>
                      <td style="padding-left: 12px; vertical-align: middle;">
                        ${
                          job.matchPercentage
                            ? `<span style="font-size: 12px; font-weight: 600; color: #057642;">${job.matchPercentage}% Match</span>`
                            : `<span style="font-size: 12px; color: rgba(0,0,0,0.6);">🎯 Actively recruiting</span>`
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SkillBridge Job Alert: ${targetField}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f2ef; font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: rgba(0,0,0,0.9);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f2ef; padding: 24px 8px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="580" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #e0dfdc; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          
          <!-- Top Nav Row (LinkedIn Style) -->
          <tr>
            <td style="padding: 16px 24px; border-bottom: 1px solid #f3f2ef;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <a href="${frontendUrl}" style="text-decoration: none;">
                      <span style="font-size: 21px; font-weight: 800; color: #0a66c2; letter-spacing: -0.5px; font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        Skill<span style="background-color: #0a66c2; color: #ffffff; padding: 2px 5px; border-radius: 4px; margin-left: 2px; font-size: 18px;">Bridge</span>
                      </span>
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0" border="0" align="right">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="${frontendUrl}/candidate-dashboard" style="color: #666666; text-decoration: none; font-size: 17px;" title="Messages">💬</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="${frontendUrl}/candidate-dashboard" style="color: #666666; text-decoration: none; font-size: 17px;" title="Network">👥</a>
                        </td>
                        <td style="padding: 0 0 0 8px;">
                          <a href="${frontendUrl}/candidate-dashboard" style="color: #666666; text-decoration: none; font-size: 17px;" title="Notifications">🔔</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading Section -->
          <tr>
            <td style="padding: 24px 24px 10px 24px;">
              <h1 style="margin: 0; font-size: 21px; font-weight: 700; color: rgba(0,0,0,0.9); line-height: 1.3;">
                Your job alert for <span style="color: #191919;">${targetField}</span>
              </h1>
            </td>
          </tr>

          <!-- Jobs List -->
          <tr>
            <td style="padding: 0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${jobRowsHtml}
              </table>
            </td>
          </tr>

          <!-- Action Buttons (See all jobs & Manage alerts) -->
          <tr>
            <td style="padding: 22px 24px 26px 24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <a href="${frontendUrl}/candidate-dashboard" style="display: inline-block; background-color: #0a66c2; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 9px 22px; border-radius: 9999px; text-align: center;">
                      See all jobs
                    </a>
                  </td>
                  <td style="padding-left: 18px;">
                    <a href="${frontendUrl}/candidate-profile" style="color: #0a66c2; font-size: 14px; font-weight: 600; text-decoration: none;">
                      Manage alerts
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top: 1px solid #e0dfdc;"></td>
          </tr>

          <!-- Career Smarter Spotlight Section -->
          <tr>
            <td style="padding: 24px 24px 20px 24px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #b24020; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;">
                ⭐ SKILLBRIDGE PREMIUM
              </div>
              <div style="font-size: 17px; font-weight: 700; color: rgba(0,0,0,0.9); margin-bottom: 6px;">
                Job search smarter with Premium
              </div>
              <div style="font-size: 13px; color: rgba(0,0,0,0.6); margin-bottom: 16px; max-width: 380px; margin-left: auto; margin-right: auto; line-height: 1.4;">
                Get personalized match analysis, profile visibility boosts, and direct application tracking.
              </div>
              <a href="${frontendUrl}/candidate-profile" style="display: inline-block; border: 1px solid rgba(0,0,0,0.75); border-radius: 9999px; padding: 7px 22px; font-size: 13px; font-weight: 600; color: rgba(0,0,0,0.75); text-decoration: none;">
                Review Profile
              </a>
            </td>
          </tr>

          <!-- Stay Updated Widget Banner (From Screenshot 2) -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e0dfdc; border-radius: 8px; background-color: #fafaf9;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 600; color: rgba(0,0,0,0.6); text-transform: uppercase; margin-bottom: 4px;">
                      Curated Opportunities
                    </div>
                    <div style="font-size: 15px; font-weight: 700; color: rgba(0,0,0,0.9); margin-bottom: 10px;">
                      Stay updated at a glance
                    </div>
                    <a href="${frontendUrl}/candidate-dashboard" style="display: inline-block; border: 1px solid #0a66c2; border-radius: 9999px; padding: 6px 16px; font-size: 12px; font-weight: 600; color: #0a66c2; text-decoration: none;">
                      Explore Jobs
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer (From Screenshot 2) -->
          <tr>
            <td style="background-color: #ffffff; border-top: 1px solid #e0dfdc; padding: 24px 24px 20px 24px; font-size: 12px; color: rgba(0,0,0,0.6); line-height: 1.5;">
              <p style="margin: 0 0 6px 0;">
                This email was intended for <strong style="color: rgba(0,0,0,0.9);">${userName || "Candidate"}</strong> (${targetField}).
              </p>
              <p style="margin: 0 0 10px 0;">
                <a href="${frontendUrl}/help" style="color: #0a66c2; text-decoration: none;">Learn why we included this.</a>
              </p>
              <p style="margin: 0 0 14px 0;">
                You are receiving Job Alert emails from SkillBridge.
              </p>
              <p style="margin: 0 0 18px 0;">
                <a href="${frontendUrl}/candidate-profile" style="color: #0a66c2; text-decoration: none;">Manage job alerts</a> &nbsp;&bull;&nbsp; 
                <a href="${frontendUrl}/candidate-profile" style="color: #0a66c2; text-decoration: none;">Unsubscribe</a> &nbsp;&bull;&nbsp; 
                <a href="${frontendUrl}/help" style="color: #0a66c2; text-decoration: none;">Help</a>
              </p>
              <div style="margin-bottom: 6px;">
                <span style="font-size: 16px; font-weight: 800; color: #0a66c2;">Skill<span style="background-color: #0a66c2; color: #ffffff; padding: 1px 4px; border-radius: 3px; margin-left: 2px; font-size: 14px;">Bridge</span></span>
              </div>
              <div style="font-size: 11px; color: rgba(0,0,0,0.5);">
                &copy; 2026 SkillBridge Corporation, All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FREQUENCY_COOLDOWN_MS = {
  daily: ONE_DAY_MS,
  weekly: 7 * ONE_DAY_MS,
  monthly: 30 * ONE_DAY_MS,
};

const runJobDigest = async () => {
  console.log("[Job Digest] Starting run at", new Date().toISOString());

  const now = Date.now();
  const oneDayAgo = new Date(now - ONE_DAY_MS);
  const sevenDaysAgoCutoff = new Date(now - FREQUENCY_COOLDOWN_MS.weekly);
  const thirtyDaysAgoCutoff = new Date(now - FREQUENCY_COOLDOWN_MS.monthly);

  // Filter eligible candidates directly in MongoDB based on their chosen digest frequency
  const candidates = await User.find({
    role: "candidate",
    emailNotificationsEnabled: { $ne: false },
    skills: { $exists: true, $ne: [] },
    $or: [
      { lastJobDigestSentAt: { $exists: false } },
      { lastJobDigestSentAt: null },
      {
        emailDigestFrequency: { $in: [null, "daily"] },
        lastJobDigestSentAt: { $lt: oneDayAgo },
      },
      {
        emailDigestFrequency: { $exists: false },
        lastJobDigestSentAt: { $lt: oneDayAgo },
      },
      {
        emailDigestFrequency: "weekly",
        lastJobDigestSentAt: { $lt: sevenDaysAgoCutoff },
      },
      {
        emailDigestFrequency: "monthly",
        lastJobDigestSentAt: { $lt: thirtyDaysAgoCutoff },
      },
    ],
  });

  let emailsSent = 0;

  for (const candidate of candidates) {
    const frequency = ["daily", "weekly", "monthly"].includes(candidate.emailDigestFrequency)
      ? candidate.emailDigestFrequency
      : "daily";
    const cooldownMs = FREQUENCY_COOLDOWN_MS[frequency] || ONE_DAY_MS;

    if (candidate.lastJobDigestSentAt) {
      const msSinceLast = Date.now() - new Date(candidate.lastJobDigestSentAt).getTime();
      if (msSinceLast < cooldownMs) {
        console.log(
          `[Job Digest] Skipping ${candidate.email} (${frequency}) - email alert already sent ${(msSinceLast / (1000 * 60 * 60)).toFixed(1)}h ago.`,
        );
        continue;
      }
    }
    let query = {
      isActive: { $ne: false },
    };

    if (candidate.lastJobDigestSentAt) {
      query.createdAt = { $gt: candidate.lastJobDigestSentAt };
    } else {
      // Default to jobs created within the last 14 days
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: fourteenDaysAgo };
    }

    let newJobs = await Job.find(query).limit(100).lean();

    // Fallback: if no brand-new jobs since last timestamp, inspect active jobs from the last 7 days
    if (newJobs.length === 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      newJobs = await Job.find({
        isActive: { $ne: false },
        createdAt: { $gte: sevenDaysAgo },
      })
        .sort({ createdAt: -1 })
        .limit(60)
        .lean();
    }

    if (newJobs.length === 0) continue;

    const candidateProfile = {
      skills: candidate.skills || [],
      field: candidate.field || "Software Engineering",
    };

    const matched = (await calculateJobMatches(newJobs, candidateProfile, true))
      .filter((job) => job.matchPercentage >= MIN_MATCH_PERCENTAGE)
      .slice(0, MAX_JOBS_PER_EMAIL);

    if (matched.length === 0) {
      candidate.lastJobDigestSentAt = new Date();
      await candidate.save();
      continue;
    }

    const targetField = candidate.field || "Software Engineer";
    const emailSubject = matched[0]?.title && matched[0]?.company
      ? `${matched[0].title} at ${matched[0].company}`
      : `Job alert for ${targetField}`;

    const html = buildDigestHtml(candidate.name, matched, candidate.email, targetField);
    await sendEmail(candidate.email, emailSubject, html);

    candidate.lastJobDigestSentAt = new Date();
    await candidate.save();
    emailsSent++;
  }

  console.log(`[Job Digest] Run complete. Sent ${emailsSent} emails out of ${candidates.length} eligible candidates.`);
  return { candidatesCount: candidates.length, emailsSent };
};

module.exports = { runJobDigest, buildDigestHtml };
