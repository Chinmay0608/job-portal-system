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

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      family: 4, // Explicitly force IPv4 to prevent ENETUNREACH on cloud environments like Render
      connectionTimeout: 10000, // 10s connection timeout
      greetingTimeout: 10000,   // 10s greeting timeout
      socketTimeout: 15000,     // 15s socket timeout
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
};

/* ==========================
   SEND EMAIL (Synchronous)
========================== */
const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`[Email Service] EMAIL_USER or EMAIL_PASS not set. Skipping email to ${to}`);
      return null;
    }

    const mailOptions = {
      from: `SkillBridge <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    console.log(`[Email Service] Sending email to ${to}`);
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    console.log(`[Email Service] Email sent to ${to}: ${info.response || "Success"}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message || error);
    // Don't throw error to prevent crashing the main thread if email fails
    return null;
  }
};

module.exports = sendEmail;
