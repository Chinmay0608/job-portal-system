const nodemailer = require("nodemailer");

/* ==========================
   SEND EMAIL (Synchronous)
========================== */
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `SkillBridge <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    console.log(`[Email Service] Sending email synchronously to ${to}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Email sent to ${to}: ${info.response}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw error to prevent crashing the main thread if email fails
  }
};

module.exports = sendEmail;
