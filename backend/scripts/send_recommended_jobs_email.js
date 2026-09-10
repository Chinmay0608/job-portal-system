require("dotenv").config();
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");

// Generates the Glassdoor-style Job Alert HTML
function generateGlassdoorStyleEmail({
  recipientName = "Krish Vijayvargiya",
  recipientEmail = "krishvijay1505@gmail.com",
  targetRole = "Data Science & Analytics Specialist",
  location = "Remote, India",
  dateFormatted = "8 September 2026",
  jobs = [],
  frontendUrl = process.env.FRONTEND_URL || "https://skillbridge.careers"
}) {
  const jobCardsHtml = jobs.map((job) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; background: #ffffff; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">${job.company}</div>
          <a href="${job.applyUrl || `${frontendUrl}/candidate-dashboard`}" style="font-size: 15px; font-weight: 700; color: #0f172a; text-decoration: none; line-height: 1.3; display: block; margin-bottom: 6px;">
            ${job.title}
          </a>
          <div style="font-size: 13px; color: #475569; margin-bottom: 6px;">${job.location || location}</div>
          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 12px;">${job.salary || "Competitive Salary (SkillBridge Est.)"}</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="left">
                <span style="display: inline-block; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 700;">
                  &#9889; Easy Apply
                </span>
              </td>
              <td align="right" style="font-size: 12px; color: #94a3b8;">
                ${job.timeAgo || "2d"}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SkillBridge Job Alert: ${targetRole}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 8px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner (Vibrant Emerald / Glassdoor Style) -->
          <tr>
            <td style="background: linear-gradient(135deg, #0caa41 0%, #059669 100%); padding: 32px 28px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Brand Wordmark -->
                    <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #ffffff; margin-bottom: 12px; text-transform: uppercase;">
                      SKILLBRIDGE
                    </div>
                    <!-- Header Title -->
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                      Job alert: ${targetRole}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Context Subtitle Section -->
          <tr>
            <td style="padding: 24px 28px 12px 28px;">
              <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">
                Your job listings for ${dateFormatted}
              </div>
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                ${targetRole}
              </div>
              <div style="font-size: 13px; color: #64748b;">
                &#128205; ${location}
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
                  <td align="right" style="vertical-align: top; width: 70px;">
                    <span style="font-size: 32px; line-height: 1;">&#129302;</span>
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
                          python developer
                        </td>
                        <td align="right">
                          <a href="${frontendUrl}/candidate-dashboard?q=python" style="display: inline-block; border: 1px solid #0f172a; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: #0f172a; text-decoration: none;">
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
                      ${targetRole}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 2px;">
                      &#128205; ${location}
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
                This message was sent to <a href="mailto:${recipientEmail}" style="color: #0caa41; text-decoration: none; font-weight: 600;">${recipientEmail}</a>
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
}

async function sendKrishJobAlert() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);

  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Job = mongoose.model("Job", new mongoose.Schema({}, { strict: false }));

  const user = await User.findOne({ email: "krishvijay1505@gmail.com" });
  console.log("Recipient user:", user?.name || "Krish Vijayvargiya");

  // Get active jobs matching skills/field
  const activeJobs = await Job.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).limit(4);

  const formattedJobs = [
    {
      company: "Tata Consultancy Services",
      title: "Data Analyst & Oracle Project Specialist",
      location: "Bangalore, Karnataka (Remote)",
      salary: "₹10L - ₹16L (SkillBridge Est.)",
      timeAgo: "2d",
      applyUrl: activeJobs[0]?.applyUrl || "https://skillbridge.careers/jobs"
    },
    {
      company: "Elfonze Technologies",
      title: "AI & Cloud Analytics Consultant",
      location: "Remote, India",
      salary: "₹12L - ₹20L (SkillBridge Est.)",
      timeAgo: "3d",
      applyUrl: activeJobs[1]?.applyUrl || "https://skillbridge.careers/jobs"
    },
    {
      company: "GC Technologies",
      title: "Python Data Engineer (Machine Learning)",
      location: "Hyderabad, Telangana (Remote)",
      salary: "₹14L - ₹22L (SkillBridge Est.)",
      timeAgo: "4d",
      applyUrl: activeJobs[2]?.applyUrl || "https://skillbridge.careers/jobs"
    }
  ];

  const html = generateGlassdoorStyleEmail({
    recipientName: user?.name || "Krish Vijayvargiya",
    recipientEmail: "krishvijay1505@gmail.com",
    targetRole: "Data Science & Analytics Specialist",
    location: "Remote, India",
    dateFormatted: new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
    jobs: formattedJobs,
    frontendUrl: "https://skillbridge-api.onrender.com"
  });

  console.log("Sending email to krishvijay1505@gmail.com...");
  const info = await sendEmail(
    "krishvijay1505@gmail.com",
    "New jobs in Remote, India. Apply Now — SkillBridge Job Alert",
    html
  );

  console.log("Email dispatch complete! Info:", info?.response || "Sent");
  await mongoose.disconnect();
}

sendKrishJobAlert().catch(console.error);
