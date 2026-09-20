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
    // Reset cached transporter on auth/connection errors so next call retries fresh
    if (error.code === "EAUTH" || error.code === "ECONNECTION" || error.code === "ENETUNREACH") {
      transporter = null;
    }
    // Don't throw error to prevent crashing the main thread if email fails
    return null;
  }
};

module.exports = sendEmail;

