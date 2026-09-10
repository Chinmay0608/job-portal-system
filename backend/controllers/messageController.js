const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");

// Helper to build branded email template for admin communications
const buildCommunicationEmail = (title, content, recipientName = "User") => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://skillbridge.careers";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 8px; background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <span style="font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">SKILLBRIDGE</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                      Official Notice
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px;">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">
                Hello ${recipientName},
              </div>
              <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
                ${title}
              </h1>
              <div style="font-size: 15px; color: #334155; line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px; padding: 16px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #2563eb;">
${content}
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${frontendUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none;">
                  Open SkillBridge
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              This is an official administrative notice sent from the SkillBridge Platform.<br />
              &copy; 2026 SkillBridge, Inc. All rights reserved.
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

// ─── POST /api/messages/send (Admin Only) ────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { title, content, targetRole = "specific", recipientId, priority = "normal", sendEmailCopy = false } = req.body;

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error("Message title is required");
  }

  if (!content || !content.trim()) {
    res.status(400);
    throw new Error("Message content is required");
  }

  const validTargetRoles = ["all", "candidate", "recruiter", "specific"];
  if (!validTargetRoles.includes(targetRole)) {
    res.status(400);
    throw new Error(`Invalid targetRole. Allowed values: ${validTargetRoles.join(", ")}`);
  }

  let recipientUser = null;
  if (targetRole === "specific") {
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      res.status(400);
      throw new Error("Valid recipientId is required for specific direct messaging");
    }

    recipientUser = await User.findById(recipientId).select("name email role").lean();
    if (!recipientUser) {
      res.status(404);
      throw new Error("Recipient user not found");
    }
  }

  // Create message document
  const message = await Message.create({
    sender: req.user.id || req.user._id,
    recipient: targetRole === "specific" ? recipientUser._id : null,
    targetRole,
    title: title.trim(),
    content: content.trim(),
    priority,
    sendEmailCopy: Boolean(sendEmailCopy),
  });

  // Asynchronous email dispatch via setImmediate (non-blocking)
  if (sendEmailCopy) {
    setImmediate(async () => {
      try {
        if (targetRole === "specific" && recipientUser?.email) {
          const html = buildCommunicationEmail(title, content, recipientUser.name);
          await sendEmail(recipientUser.email, `[Notice] ${title}`, html);
          console.log(`[Admin Message] Email copy sent to ${recipientUser.email}`);
        } else {
          // Segment broadcast
          const query = { role: { $in: ["candidate", "recruiter"] } };
          if (targetRole === "candidate") query.role = "candidate";
          if (targetRole === "recruiter") query.role = "recruiter";

          const recipients = await User.find(query).select("email name").lean();
          console.log(`[Admin Broadcast] Dispatching email copy to ${recipients.length} recipients...`);

          // Chunked delivery to prevent throttling
          for (const u of recipients) {
            if (!u.email) continue;
            try {
              const html = buildCommunicationEmail(title, content, u.name);
              await sendEmail(u.email, `[Announcement] ${title}`, html);
            } catch (err) {
              console.warn(`[Admin Broadcast Error] Failed sending to ${u.email}:`, err.message);
            }
          }
        }
      } catch (err) {
        console.error("[Admin Message Email Error]:", err.message);
      }
    });
  }

  res.status(201).json({
    success: true,
    message: "Message dispatched successfully",
    data: message,
  });
});

// ─── GET /api/messages/my-messages (All Authenticated Users) ─────────────────
const getUserMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role || "candidate";

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const unreadOnly = req.query.unreadOnly === "true" || req.query.unreadOnly === true;

  // Base filter: messages addressed directly to user OR broadcast to user's role or "all"
  const baseOrFilter = [
    { recipient: userId },
    { targetRole: "all" },
    { targetRole: userRole },
  ];

  const filter = {
    isArchived: false,
    $or: baseOrFilter,
  };

  if (unreadOnly) {
    filter["readBy.user"] = { $ne: userId };
  }

  const [rawMessages, totalCount, totalUnreadCount] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name role email")
      .lean(),
    Message.countDocuments(filter),
    Message.countDocuments({
      isArchived: false,
      $or: baseOrFilter,
      "readBy.user": { $ne: userId },
    }),
  ]);

  // Compute virtual isRead boolean and format output
  const messages = rawMessages.map((msg) => {
    const isRead = Array.isArray(msg.readBy) && msg.readBy.some(
      (entry) => entry.user?.toString() === userId.toString()
    );

    return {
      _id: msg._id,
      title: msg.title,
      content: msg.content,
      priority: msg.priority,
      targetRole: msg.targetRole,
      createdAt: msg.createdAt,
      sender: msg.sender || { name: "SkillBridge Administration", role: "admin" },
      isRead,
    };
  });

  res.status(200).json({
    success: true,
    messages,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
    unreadCount: totalUnreadCount,
  });
});

// ─── GET /api/messages/unread-count (Authenticated Users) ───────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role || "candidate";

  const count = await Message.countDocuments({
    isArchived: false,
    $or: [
      { recipient: userId },
      { targetRole: "all" },
      { targetRole: userRole },
    ],
    "readBy.user": { $ne: userId },
  });

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});

// ─── PATCH /api/messages/:id/read (Authenticated Users) ──────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid message ID");
  }

  const message = await Message.findById(id);
  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  // Atomically add user to readBy array if not already present
  const alreadyRead = message.readBy.some((r) => r.user.toString() === userId.toString());
  if (!alreadyRead) {
    message.readBy.push({ user: userId, readAt: new Date() });
    await message.save();
  }

  res.status(200).json({
    success: true,
    message: "Message marked as read",
    data: { _id: message._id, isRead: true },
  });
});

// ─── PATCH /api/messages/read-all (Authenticated Users) ──────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const userRole = req.user.role || "candidate";

  const filter = {
    isArchived: false,
    $or: [
      { recipient: userId },
      { targetRole: "all" },
      { targetRole: userRole },
    ],
    "readBy.user": { $ne: userId },
  };

  await Message.updateMany(filter, {
    $addToSet: {
      readBy: { user: userId, readAt: new Date() },
    },
  });

  res.status(200).json({
    success: true,
    message: "All messages marked as read",
  });
});

// ─── GET /api/messages/sent (Admin Only) ─────────────────────────────────────
const getAdminSentMessages = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const [rawMessages, totalCount] = await Promise.all([
    Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name email role")
      .populate("recipient", "name email role")
      .lean(),
    Message.countDocuments(),
  ]);

  const messages = rawMessages.map((msg) => ({
    _id: msg._id,
    title: msg.title,
    content: msg.content,
    targetRole: msg.targetRole,
    priority: msg.priority,
    sendEmailCopy: msg.sendEmailCopy,
    createdAt: msg.createdAt,
    sender: msg.sender,
    recipient: msg.recipient,
    readCount: Array.isArray(msg.readBy) ? msg.readBy.length : 0,
  }));

  res.status(200).json({
    success: true,
    messages,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  });
});

// ─── GET /api/messages/search-recipients (Admin Only) ────────────────────────
const searchRecipients = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q || q.length < 2) {
    return res.status(200).json({ success: true, users: [] });
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const users = await User.find({
    $or: [{ name: regex }, { email: regex }],
  })
    .select("_id name email role")
    .limit(10)
    .lean();

  res.status(200).json({
    success: true,
    users,
  });
});

module.exports = {
  sendMessage,
  getUserMessages,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getAdminSentMessages,
  searchRecipients,
};
