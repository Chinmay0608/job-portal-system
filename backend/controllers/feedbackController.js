const asyncHandler = require("express-async-handler");
const AiFeedback = require("../models/AiFeedback");
const User = require("../models/user");

/* ============================================================
   POST /api/jobs/ai/feedback
   Persist a thumbs-up or thumbs-down rating for a DHRUV turn.
   Requires candidate authentication (req.user injected by protect).
   ============================================================ */
const submitAiFeedback = asyncHandler(async (req, res) => {
  const { prompt, response, rating } = req.body;

  if (!prompt || !response || !["positive", "negative"].includes(rating)) {
    res.status(400);
    throw new Error("prompt, response, and a valid rating (positive | negative) are required.");
  }

  // Optionally enrich with candidate profile fields for richer training context
  let candidateSkills = [];
  let candidateField = "";
  const userId = req.user?.id || req.user?._id || null;
  if (userId) {
    try {
      const user = await User.findById(userId).select("skills field").lean();
      candidateSkills = user?.skills || [];
      candidateField  = user?.field  || "";
    } catch (_) {
      // Non-critical — proceed without enrichment
    }
  }

  const feedback = await AiFeedback.create({
    user:           userId,
    prompt:         prompt.slice(0, 4000),   // guard against runaway payloads
    response:       response.slice(0, 8000),
    rating,

    candidateSkills,
    candidateField,
  });

  res.status(201).json({ success: true, id: feedback._id, rating: feedback.rating });
});

/* ============================================================
   GET /api/admin/export-dhruv-training
   Admin-only: stream all positively-rated turns as JSONL
   suitable for Google AI Studio fine-tuning.
   ============================================================ */
const exportDhruvTraining = asyncHandler(async (req, res) => {
  const SYSTEM_MSG = "You are DHRUV, SkillBridge's authentic, data-driven AI Career Coach and Job Search Assistant.";

  // Stream rows so we never load the entire collection into memory
  const cursor = AiFeedback.find({ rating: "positive" })
    .select("prompt response createdAt")
    .sort({ createdAt: -1 })
    .lean()
    .cursor();

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dhruv_training_${new Date().toISOString().slice(0, 10)}.jsonl"`
  );

  let count = 0;
  for await (const doc of cursor) {
    const line = JSON.stringify({
      messages: [
        { role: "system",    content: SYSTEM_MSG       },
        { role: "user",      content: doc.prompt       },
        { role: "assistant", content: doc.response     },
      ],
    });
    res.write(line + "\n");
    count++;
  }

  // End the stream
  res.end();
  console.log(`[exportDhruvTraining] Exported ${count} positive-feedback JSONL records.`);
});

module.exports = { submitAiFeedback, exportDhruvTraining };
