"use strict";

const axios = require("axios");
const mongoose = require("mongoose");
const SupportTicket = require("../models/SupportTicket");
const Job = require("../models/job");
const User = require("../models/user");
const { getTelegramConfig, sendTelegramMessage, sendTelegramPhoto } = require("./telegramService");

let isPolling = false;
let shouldStop = false;

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function handleCommand(commandText, chatId) {
  const parts = commandText.trim().split(/\s+/);
  const rawCommand = parts[0].toLowerCase().split("@")[0];
  const arg = parts.slice(1).join(" ").trim();
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://job-portal-system-alpha.vercel.app";

  try {
    switch (rawCommand) {
      case "/start": {
        const welcome = [
          "👋 <b>Welcome to SkillBridge Operations Bot!</b>",
          "",
          "I am connected to your SkillBridge backend. I deliver instant support ticket alerts and let you manage platform operations directly from Telegram.",
          "",
          "<b>Quick Commands:</b>",
          "• /stats — Platform Overview (Tickets, Jobs, Users)",
          "• /tickets — Recent Open / In-Progress Tickets",
          "• /jobs — Latest 5 Job Listings",
          "• /health — System & Database Health Check",
          "• /dashboard — Direct Admin Support Desk Link",
          "• /myid — Check your Telegram Chat ID",
          "• /help — Full Command Directory",
          "",
          `👉 <a href="${frontendUrl}/admin/dashboard">Open Admin Support Desk</a>`,
        ].join("\n");
        return await sendTelegramMessage(welcome, { extra: { chat_id: chatId } });
      }

      case "/help": {
        const help = [
          "📖 <b>SkillBridge Management Commands Directory</b>",
          "",
          "<b>/start</b> — Welcome & connection verification",
          "<b>/stats</b> — Total open tickets, active jobs, candidates & recruiters",
          "<b>/tickets</b> — Last 5 open/in-progress support issues",
          "<b>/ticket &lt;id&gt;</b> — Deep inspection of a ticket (e.g. <code>/ticket 8C8144F4</code>)",
          "<b>/health</b> — Live status of MongoDB, Gemini API, and Express server",
          "<b>/jobs</b> — Quick feed of latest jobs posted",
          "<b>/dashboard</b> — Direct link to Admin Support Desk",
          "<b>/myid</b> — Echoes your Telegram Chat ID for .env setup",
        ].join("\n");
        return await sendTelegramMessage(help, { extra: { chat_id: chatId } });
      }

      case "/stats": {
        const [totalTickets, openTickets, resolvedTickets, totalJobs, candidatesCount, recruitersCount] = await Promise.all([
          SupportTicket.countDocuments({}),
          SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
          SupportTicket.countDocuments({ status: "resolved" }),
          Job.countDocuments({}),
          User.countDocuments({ role: "candidate" }),
          User.countDocuments({ role: "recruiter" }),
        ]);

        const stats = [
          "📊 <b>SkillBridge Platform Overview</b>",
          "",
          `🎫 <b>Open / Active Tickets:</b> ${openTickets}`,
          `✅ <b>Resolved Tickets:</b> ${resolvedTickets}`,
          `📁 <b>Total Tickets:</b> ${totalTickets}`,
          "─────────────────────",
          `💼 <b>Active Job Listings:</b> ${totalJobs}`,
          `👤 <b>Registered Candidates:</b> ${candidatesCount}`,
          `🏢 <b>Registered Recruiters:</b> ${recruitersCount}`,
          `👥 <b>Total Users:</b> ${candidatesCount + recruitersCount}`,
          "",
          `👉 <a href="${frontendUrl}/admin/dashboard">Open Admin Dashboard</a>`,
        ].join("\n");
        return await sendTelegramMessage(stats, { extra: { chat_id: chatId } });
      }

      case "/tickets": {
        const tickets = await SupportTicket.find({ status: { $in: ["open", "in_progress"] } })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        if (!tickets || tickets.length === 0) {
          return await sendTelegramMessage("🎉 <b>Zero pending tickets!</b> All support requests are resolved.", { extra: { chat_id: chatId } });
        }

        const lines = ["🎫 <b>Latest Open Support Tickets (Top 5):</b>", ""];
        tickets.forEach((t, idx) => {
          const ref = `#${String(t._id).slice(-8).toUpperCase()}`;
          const isUrgent = t.severity === "high";
          const desc = t.description ? t.description.slice(0, 80) : "No description";
          lines.push(
            `${idx + 1}. <b>${ref}</b> [${(t.status || "OPEN").toUpperCase()}] ${isUrgent ? "🔴 <b>URGENT</b>" : ""}`,
            `   <b>From:</b> ${escapeHtml(t.email || "Guest")}`,
            `   <b>Category:</b> ${t.category || "General"} | <b>Sev:</b> ${t.severity || "normal"}`,
            `   <i>\"${escapeHtml(desc)}\"</i>`,
            `   Inspect: <code>/ticket ${ref.replace("#", "")}</code>`,
            ""
          );
        });

        lines.push(`👉 <a href="${frontendUrl}/admin/dashboard">Manage All on Admin Desk</a>`);
        return await sendTelegramMessage(lines.join("\n"), { extra: { chat_id: chatId } });
      }

      case "/ticket": {
        if (!arg) {
          return await sendTelegramMessage("⚠️ Please provide a ticket ID or reference, e.g. <code>/ticket 8C8144F4</code>", { extra: { chat_id: chatId } });
        }

        const cleanArg = arg.replace("#", "").trim();
        let ticket = null;
        if (cleanArg.length === 24 && /^[0-9a-fA-F]+$/.test(cleanArg)) {
          ticket = await SupportTicket.findById(cleanArg).lean();
        } else {
          const allRecent = await SupportTicket.find({}).sort({ createdAt: -1 }).limit(50).lean();
          ticket = allRecent.find((t) => String(t._id).toUpperCase().endsWith(cleanArg.toUpperCase()));
        }

        if (!ticket) {
          return await sendTelegramMessage(`❌ No ticket found matching reference <code>${escapeHtml(arg)}</code>. Use /tickets to see current queue.`, { extra: { chat_id: chatId } });
        }

        const ref = `#${String(ticket._id).slice(-8).toUpperCase()}`;
        const lines = [
          `🔍 <b>Ticket Details ${ref}</b>`,
          "",
          `<b>Status:</b> ${(ticket.status || "OPEN").toUpperCase()}`,
          `<b>Reporter:</b> ${escapeHtml(ticket.email || "Guest")}`,
          `<b>Category:</b> ${ticket.category || "General"}`,
          `<b>Severity:</b> ${ticket.severity ? ticket.severity.toUpperCase() : "NORMAL"}`,
          `<b>Reported URL:</b> <code>${ticket.pageUrl || "/"}</code>`,
          `<b>Created:</b> ${new Date(ticket.createdAt).toLocaleString()}`,
          "",
          "<b>Description:</b>",
          `<i>${escapeHtml(ticket.description || "No description provided")}</i>`,
        ];

        if (ticket.aiSummary) {
          lines.push("", `<b>AI Summary:</b> ${escapeHtml(ticket.aiSummary)}`);
        }

        lines.push("", `👉 <a href="${frontendUrl}/admin/dashboard">View in Admin Desk</a>`);
        const message = lines.join("\n");

        if (ticket.screenshotUrl && String(ticket.screenshotUrl).startsWith("http")) {
          const photoRes = await sendTelegramPhoto(ticket.screenshotUrl, message);
          if (photoRes.success) return photoRes;
        }

        return await sendTelegramMessage(message, { extra: { chat_id: chatId } });
      }

      case "/health": {
        const uptimeSeconds = Math.floor(process.uptime());
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

        const mongoState = mongoose.connection.readyState === 1 ? "🟢 Connected" : "🔴 Disconnected";
        const geminiState = process.env.GEMINI_API_KEY ? "🟢 Configured (gemini-3.6-flash)" : "🔴 Missing Key";
        const cloudinaryState = process.env.CLOUD_API_KEY ? "🟢 Configured" : "🔴 Not Set";

        const health = [
          "🩺 <b>SkillBridge System Health Report</b>",
          "",
          `<b>Server Status:</b> 🟢 Operational`,
          `<b>Server Uptime:</b> ${uptimeStr}`,
          `<b>Node Version:</b> ${process.version}`,
          `<b>MongoDB:</b> ${mongoState}`,
          `<b>Gemini AI Engine:</b> ${geminiState}`,
          `<b>Cloudinary Media:</b> ${cloudinaryState}`,
          "",
          `<i>Checked at: ${new Date().toUTCString()}</i>`,
        ].join("\n");
        return await sendTelegramMessage(health, { extra: { chat_id: chatId } });
      }

      case "/jobs": {
        const jobs = await Job.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .select("title company location jobType isExternal createdAt")
          .lean();

        if (!jobs || jobs.length === 0) {
          return await sendTelegramMessage("No jobs found in the database.", { extra: { chat_id: chatId } });
        }

        const lines = ["💼 <b>Latest Active Job Listings (Top 5):</b>", ""];
        jobs.forEach((j, idx) => {
          lines.push(
            `${idx + 1}. <b>${escapeHtml(j.title)}</b> at <b>${escapeHtml(j.company)}</b>`,
            `   📍 ${escapeHtml(j.location || "Remote")} | 💼 ${j.jobType || "Full-time"}`,
            ""
          );
        });

        lines.push(`👉 <a href="${frontendUrl}/candidate-dashboard">View All Jobs</a>`);
        return await sendTelegramMessage(lines.join("\n"), { extra: { chat_id: chatId } });
      }

      case "/dashboard": {
        const text = [
          "⚡ <b>Direct Access: SkillBridge Admin Support Desk</b>",
          "",
          "Tap the link below to open your secure admin control center:",
          `👉 <a href="${frontendUrl}/admin/dashboard">Open Admin Support Desk</a>`,
        ].join("\n");
        return await sendTelegramMessage(text, { extra: { chat_id: chatId } });
      }

      case "/myid": {
        const text = [
          "🆔 <b>Telegram Identity Check</b>",
          "",
          `Your Telegram Chat ID is: <code>${chatId}</code>`,
          "",
          `Make sure this matches <code>TELEGRAM_CHAT_ID=${chatId}</code> in your <code>backend/.env</code> and production Render configuration.`,
        ].join("\n");
        return await sendTelegramMessage(text, { extra: { chat_id: chatId } });
      }

      default: {
        return await sendTelegramMessage(
          `❓ Unrecognized command <code>${escapeHtml(rawCommand)}</code>.\n\nType /help to see all available commands.`,
          { extra: { chat_id: chatId } }
        );
      }
    }
  } catch (err) {
    console.error(`[TelegramBot] Error handling command ${rawCommand}:`, err.message);
    return await sendTelegramMessage(
      `⚠️ An error occurred while executing ${escapeHtml(rawCommand)}: ${escapeHtml(err.message)}`,
      { extra: { chat_id: chatId } }
    );
  }
}

let currentAbortController = null;

async function startTelegramBot() {
  const { token } = getTelegramConfig();
  if (!token) {
    console.log("[TelegramBot] Skipping bot poller: TELEGRAM_BOT_TOKEN not configured");
    return;
  }

  if (process.env.DISABLE_TELEGRAM_POLLING === "true") {
    console.log("[TelegramBot] Skipping bot poller: DISABLE_TELEGRAM_POLLING is set to true");
    return;
  }

  if (isPolling) {
    console.log("[TelegramBot] Poller is already active.");
    return;
  }

  isPolling = true;
  shouldStop = false;
  let offset = 0;
  let consecutiveConflicts = 0;

  console.log("[TelegramBot] 🚀 Starting Telegram Bot polling loop...");

  while (!shouldStop) {
    try {
      currentAbortController = new AbortController();
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`;
      const response = await axios.get(url, {
        timeout: 35000,
        signal: currentAbortController.signal,
      });
      currentAbortController = null;
      consecutiveConflicts = 0;

      const updates = response.data?.result || [];

      for (const update of updates) {
        offset = update.update_id + 1;

        const message = update.message;
        if (!message || !message.text) continue;

        const chatId = message.chat?.id;
        const text = message.text.trim();

        if (text.startsWith("/")) {
          console.log(`[TelegramBot] Received command: "${text}" from chatId ${chatId}`);
          await handleCommand(text, chatId);
        }
      }
    } catch (error) {
      currentAbortController = null;
      if (shouldStop || axios.isCancel(error) || error.name === "CanceledError" || error.name === "AbortError") {
        break;
      }
      const errMsg = error.response?.data?.description || error.message || "";
      const status = error.response?.status;

      if (error.code === "ECONNABORTED" || (errMsg && errMsg.includes("timeout"))) {
        continue;
      }

      const isConflict = status === 409 || (errMsg && (errMsg.includes("Conflict") || errMsg.includes("terminated by other")));

      if (isConflict) {
        consecutiveConflicts++;
        const backoffSec = Math.min(60, 10 * consecutiveConflicts);
        if (consecutiveConflicts === 1 || consecutiveConflicts % 6 === 0) {
          console.warn(
            `[TelegramBot] ⚠️ 409 Conflict: Another bot instance (e.g., production on Render or another local process) is active (attempt ${consecutiveConflicts}). Backing off for ${backoffSec}s.\n[TelegramBot] Tip: Set DISABLE_TELEGRAM_POLLING=true in backend/.env to disable local polling when testing.`
          );
        }
        await new Promise((r) => setTimeout(r, backoffSec * 1000));
      } else {
        console.warn("[TelegramBot] Polling error (retrying in 5s):", errMsg);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  isPolling = false;
  console.log("[TelegramBot] Polling loop stopped.");
}

function stopTelegramBot() {
  shouldStop = true;
  if (currentAbortController) {
    try {
      currentAbortController.abort();
    } catch (e) {}
  }
}

if (typeof process !== "undefined") {
  process.once("SIGUSR2", () => {
    stopTelegramBot();
  });
  process.on("SIGINT", () => {
    stopTelegramBot();
  });
  process.on("SIGTERM", () => {
    stopTelegramBot();
  });
}

module.exports = {
  startTelegramBot,
  stopTelegramBot,
  handleCommand,
};
