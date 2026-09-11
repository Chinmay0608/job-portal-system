const User = require("../models/user");
const Job = require("../models/job");
const sendEmail = require("../utils/sendEmail");
const { calculateJobMatches } = require("./jobMatchService");

const MIN_MATCH_PERCENTAGE = 40; // only notify about reasonably relevant matches
const MAX_JOBS_PER_EMAIL = 4;

/**
 * Builds a modern, responsive Glassdoor-style Job Alert HTML email
 */
const buildDigestHtml = (userName, jobs, recipientEmail = "", targetField = "Recommended Jobs") => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://skillbridge.careers";
  const dateFormatted = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });

  const jobCardsHtml = jobs
    .map(
      (job) => `
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; background: #ffffff; overflow: hidden;">
        <tr>
          <td style="padding: 16px 20px;">
            <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">${job.company}</div>
            <a href="${job.applyUrl || `${frontendUrl}/candidate-dashboard`}" style="font-size: 15px; font-weight: 700; color: #0f172a; text-decoration: none; line-height: 1.3; display: block; margin-bottom: 6px;">
              ${job.title}
            </a>
            <div style="font-size: 13px; color: #475569; margin-bottom: 6px;">${job.location || "Remote, India"}</div>
            <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">${job.salary || "Competitive Salary (SkillBridge Est.)"}</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left">
                  <span style="display: inline-block; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 700;">
                    &#9889; Easy Apply
                  </span>
                  ${job.matchPercentage ? `<span style="display: inline-block; margin-left: 6px; background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 700;">${job.matchPercentage}% Match</span>` : ""}
                </td>
                <td align="right" style="font-size: 12px; color: #94a3b8;">
                  Active
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SkillBridge Job Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 8px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Emerald Gradient Glassdoor Style) -->
          <tr>
            <td style="background: linear-gradient(135deg, #0caa41 0%, #059669 100%); padding: 32px 28px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Brand Wordmark -->
                    <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #ffffff; margin-bottom: 10px; text-transform: uppercase;">
                      SKILLBRIDGE
                    </div>
                    <!-- Header Title -->
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                      Job alert: ${targetField}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Subtitle Section -->
          <tr>
            <td style="padding: 24px 28px 12px 28px;">
              <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">
                Your job listings for ${dateFormatted}
              </div>
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                Hi ${userName || "there"}, here are your personalized recommendations:
              </div>
              <div style="font-size: 13px; color: #64748b;">
                &#128205; Remote, India
              </div>
            </td>
          </tr>

          <!-- Recommended Jobs List -->
          <tr>
            <td style="padding: 8px 28px 20px 28px;">
              ${jobCardsHtml}
            </td>
          </tr>

          <!-- Big CTA Button -->
          <tr>
            <td align="center" style="padding: 4px 28px 28px 28px;">
              <a href="${frontendUrl}/candidate-dashboard" style="display: inline-block; background-color: #0caa41; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 44px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(12, 170, 65, 0.35); text-align: center;">
                See more jobs
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 28px;">
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 0;" />
            </td>
          </tr>

          <!-- "Want more listings like these?" Section -->
          <tr>
            <td style="padding: 24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="left" style="vertical-align: top;">
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                      Want more listings like these?
                    </div>
                    <div style="font-size: 13px; color: #64748b; line-height: 1.4;">
                      Similar jobs can have different titles.<br/>Create job alerts for related roles.
                    </div>
                  </td>
                  <td align="right" style="vertical-align: top; width: 60px;">
                    <span style="font-size: 32px;">&#128188;</span>
                  </td>
                </tr>
              </table>

              <!-- Related Roles List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left" style="font-size: 14px; font-weight: 600; color: #0f172a;">
                          data analyst
                        </td>
                        <td align="right">
                          <a href="${frontendUrl}/candidate-dashboard?q=data+analyst" style="display: inline-block; border: 1px solid #0f172a; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: #0f172a; text-decoration: none;">
                            Create
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left" style="font-size: 14px; font-weight: 600; color: #0f172a;">
                          machine learning engineer
                        </td>
                        <td align="right">
                          <a href="${frontendUrl}/candidate-dashboard?q=machine+learning" style="display: inline-block; border: 1px solid #0f172a; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: #0f172a; text-decoration: none;">
                            Create
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left" style="font-size: 14px; font-weight: 600; color: #0f172a;">
                          software engineer
                        </td>
                        <td align="right">
                          <a href="${frontendUrl}/candidate-dashboard?q=software+engineer" style="display: inline-block; border: 1px solid #0f172a; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: #0f172a; text-decoration: none;">
                            Create
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- "Looking for something a little different?" Section -->
          <tr>
            <td style="padding: 8px 28px 28px 28px;">
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                Looking for something a little different?
              </div>
              <div style="font-size: 13px; color: #64748b; margin-bottom: 14px;">
                You can edit your job alert preferences here.
              </div>

              <!-- Alert Preference Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background-color: #ffffff;">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                      ${targetField}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">
                      &#128205; Remote, India
                    </div>
                    <div style="font-size: 12px; color: #94a3b8;">
                      &#128276; Sent Daily
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <a href="${frontendUrl}/candidate-profile" style="display: inline-block; border: 1px solid #0f172a; border-radius: 6px; padding: 7px 16px; font-size: 12px; font-weight: 700; color: #0f172a; text-decoration: none;">
                      Edit
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 28px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;">
                This message was sent to <a href="mailto:${recipientEmail}" style="color: #0caa41; text-decoration: none; font-weight: 600;">${recipientEmail || "your account email"}</a>
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b;">
                <a href="${frontendUrl}/privacy-policy" style="color: #0caa41; text-decoration: none;">Privacy Policy</a> &nbsp;|&nbsp; 
                <a href="${frontendUrl}/candidate-profile" style="color: #0caa41; text-decoration: none;">Manage settings</a> &nbsp;|&nbsp; 
                <a href="${frontendUrl}/candidate-profile" style="color: #0caa41; text-decoration: none;">Unsubscribe</a>
              </p>
              <div style="font-size: 16px; font-weight: 800; color: #0caa41; margin-bottom: 6px;">
                SkillBridge
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                SkillBridge Inc. &bull; Career Intelligence & Job Matching Platform<br/>
                Copyright &copy; 2026 SkillBridge, Inc. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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

    const matched = (await calculateJobMatches(newJobs, candidateProfile, true))
      .filter((job) => job.matchPercentage >= MIN_MATCH_PERCENTAGE)
      .slice(0, MAX_JOBS_PER_EMAIL);

    if (matched.length === 0) {
      candidate.lastJobDigestSentAt = new Date();
      await candidate.save();
      continue;
    }

    const html = buildDigestHtml(candidate.name, matched, candidate.email, candidate.field || "Recommended Jobs");
    await sendEmail(candidate.email, `Job alert: ${candidate.field || "Recommended Jobs"} — SkillBridge`, html);

    candidate.lastJobDigestSentAt = new Date();
    await candidate.save();
    emailsSent++;
  }

  console.log(`[Job Digest] Run complete. Sent ${emailsSent} emails out of ${candidates.length} eligible candidates.`);
  return { candidatesCount: candidates.length, emailsSent };
};

module.exports = { runJobDigest, buildDigestHtml };
