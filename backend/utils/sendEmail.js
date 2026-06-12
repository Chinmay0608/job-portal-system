const nodemailer = require("nodemailer");

/* ==========================
   EMAIL TRANSPORTER
========================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ==========================
   SEND EMAIL
========================== */
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email Error:", error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;