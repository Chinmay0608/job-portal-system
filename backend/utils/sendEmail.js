const { emailQueue } = require("../queue/emailQueue");


/* ==========================
   SEND EMAIL
========================== */
const sendEmail = async (to, subject, html) => {
  try {
    // Enqueue the email job
    await emailQueue.add("sendEmailJob", {
      to,
      subject,
      html,
    });
    console.log(`[Email Queue] Queued email to ${to}`);
  } catch (error) {
    console.error("Error queuing email:", error);
    throw new Error("Email queuing failed");
  }
};

module.exports = sendEmail;
