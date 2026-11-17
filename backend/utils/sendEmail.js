const nodemailer = require("nodemailer");
const dns = require("dns");

// Ensure IPv4 lookup precedence across containers (Render/AWS/Heroku) to avoid ENETUNREACH on IPv6
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch (e) {
    // ignore
  }
}

let transporter = null;

const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,          // 587+STARTTLS avoids IPv6 resolution issues on Render
    secure: false,      // STARTTLS (upgraded after handshake)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    family: 4,          // Explicitly force IPv4 socket
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false,
    },
  });

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/* ==========================
   SEND EMAIL (Synchronous)
========================== */
const stripHtml = (html) => {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&bull;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
};

const sendEmail = async (to, subject, html, text = null, customHeaders = {}) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`[Email Service] EMAIL_USER or EMAIL_PASS not set. Skipping email to ${to}`);
      return null;
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://skillbridge.careers";
    const unsubscribeUrl = `${frontendUrl}/candidate-profile?action=unsubscribe`;

    const plainText = text || stripHtml(html);

    const mailOptions = {
      from: `SkillBridge <${process.env.EMAIL_USER}>`,
      to,
      replyTo: `SkillBridge Support <${process.env.EMAIL_USER}>`,
      subject,
      text: plainText,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:${process.env.EMAIL_USER}?subject=Unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "Precedence": "bulk",
        "X-Mailer": "SkillBridge Career Intelligence Mailer",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
        ...customHeaders,
      },
    };

    console.log(`[Email Service] Sending email to ${to}`);
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    console.log(`[Email Service] Email sent to ${to}: ${info.response || "Success"}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message || error);
    // Reset cached transporter on auth/connection errors so next call retries fresh
    if (error.code === "EAUTH" || error.code === "ECONNECTION" || error.code === "ENETUNREACH") {
      transporter = null;
    }
    // Don't throw error to prevent crashing the main thread if email fails
    return null;
  }
};

module.exports = sendEmail;

