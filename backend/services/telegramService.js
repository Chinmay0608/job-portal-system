"use strict";

const axios = require("axios");

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * sendTelegramMessage
 * Sends text message to Telegram Bot API.
 * Gracefully skips if credentials are not configured in .env.
 */
async function sendTelegramMessage(text, options = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      success: false,
      skipped: true,
      reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in backend/.env",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await axios.post(
      url,
      {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || "HTML",
        disable_web_page_preview: options.disablePreview || false,
        ...options.extra,
      },
      { timeout: 10000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    const errDetail = error.response?.data?.description || error.message;
    console.error("[TelegramService] Failed to send message:", errDetail);
    return { success: false, error: errDetail };
  }
}

/**
 * sendTelegramPhoto
 * Sends photo with HTML caption to Telegram if a screenshot URL exists.
 */
async function sendTelegramPhoto(photoUrl, caption) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || !photoUrl) {
    return { success: false, skipped: true };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    const response = await axios.post(
      url,
      {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption.slice(0, 1024),
        parse_mode: "HTML",
      },
      { timeout: 15000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    const errDetail = error.response?.data?.description || error.message;
    console.error("[TelegramService] Failed to send photo:", errDetail);
    return { success: false, error: errDetail };
  }
}

/**
 * sendTicketAlertToTelegram
 * Formats a support ticket and sends it to the Telegram chat.
 */
async function sendTicketAlertToTelegram(ticket, outcome = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, skipped: true, reason: "Telegram credentials not set" };
  }

  const ticketRef = `#${String(ticket._id).slice(-8).toUpperCase()}`;
  const isHigh = outcome.isHighSeverity || ticket.severity === "high";
  const status = outcome.finalStatus ? outcome.finalStatus.toUpperCase() : (ticket.status || "OPEN").toUpperCase();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const lines = [
    `<b>${isHigh ? "🔴 URGENT SUPPORT TICKET" : "🎫 NEW SUPPORT TICKET RAISED"}</b>`,
    "",
    `<b>Ticket Ref:</b> <code>${ticketRef}</code>`,
    `<b>Status:</b> <b>${status}</b>`,
    `<b>Reporter:</b> ${ticket.email || "Guest"}`,
    `<b>Category:</b> ${ticket.category || "General"}`,
    `<b>Severity:</b> ${ticket.severity ? ticket.severity.toUpperCase() : "NORMAL"}`,
    `<b>Page URL:</b> <code>${ticket.pageUrl || "/"}</code>`,
    "",
    "<b>Description:</b>",
    `<i>${escapeHtml(ticket.description || "No description")}</i>`,
    ""
  ];

  if (ticket.aiSummary) {
    lines.push(`<b>AI Summary:</b> ${escapeHtml(ticket.aiSummary)}`, "");
  }

  lines.push(`<a href="${frontendUrl}/admin/dashboard">👉 Open Admin Support Desk</a>`);

  const message = lines.join("\n");

  // If a screenshot was uploaded, send as photo with caption
  if (ticket.screenshotUrl && String(ticket.screenshotUrl).startsWith("http")) {
    const photoResult = await sendTelegramPhoto(ticket.screenshotUrl, message);
    if (photoResult.success) {
      console.log(`[TelegramService] Photo alert sent for ticket ${ticketRef}`);
      return photoResult;
    }
  }

  const textResult = await sendTelegramMessage(message);
  if (textResult.success) {
    console.log(`[TelegramService] Text alert sent for ticket ${ticketRef}`);
  }
  return textResult;
}

module.exports = {
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTicketAlertToTelegram,
};
