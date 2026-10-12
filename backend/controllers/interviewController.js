const asyncHandler = require("express-async-handler");
const InterviewSession = require("../models/InterviewSession");
const User = require("../models/user");
const Job = require("../models/job");
const {
  generateInterviewQuestions,
  evaluateCandidateAnswer,
} = require("../services/interviewAssistantService");

/* ==========================================================================
   START INTERVIEW SESSION
   POST /api/interview/start
   ========================================================================== */
const startInterviewSession = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const jobDomain = req.body.jobDomain || user.field || "Software Engineering";
  const targetSeniority =
    req.body.targetSeniority ||
    (Array.isArray(user.targetSeniority) && user.targetSeniority.length > 0
      ? user.targetSeniority[0]
      : "Entry Level");
  const interviewType = req.body.interviewType || "mixed";
  let job = null;
  if (req.body.jobId) {
    job = await Job.findById(req.body.jobId).select("title company location description domain skillsRequired experienceRequired");
    if (!job) {
      res.status(404);
      throw new Error("The job for this prep kit could not be found.");
    }
  }

  // Generate customized questions
  const rawQuestions = await generateInterviewQuestions({
    domain: jobDomain,
    seniority: targetSeniority,
    type: interviewType,
    skills: user.skills || [],
    candidateExperience: user.experienceLevel || "",
    jobTitle: job?.title || "",
    company: job?.company || "",
    location: job?.location || "",
    jobDescription: job?.description || "",
    jobSkills: job?.skillsRequired || [],
  });

  const formattedQuestions = rawQuestions.map((q) => ({
    questionId: q.questionId,
    questionText: q.questionText,
    category: q.category || "technical",
    candidateAnswer: "",
    aiScore: 0,
    aiFeedback: { strengths: [], improvements: [], suggestedAnswer: "" },
  }));

  const session = await InterviewSession.create({
    candidate: req.user.id,
    jobId: job?._id || null,
    jobTitle: job?.title || "",
    company: job?.company || "",
    jobLocation: job?.location || "",
    jobDescription: job?.description || "",
    jobDomain,
    targetSeniority,
    interviewType,
    questions: formattedQuestions,
    status: "in_progress",
  });

  res.status(201).json({
    message: job ? "TRAO AI interview prep kit created." : "TRAO AI Interview Session initialized.",
    sessionId: session._id,
    jobTitle: session.jobTitle,
    company: session.company,
    jobLocation: session.jobLocation,
    jobDomain: session.jobDomain,
    targetSeniority: session.targetSeniority,
    interviewType: session.interviewType,
    questions: session.questions.map((q) => ({
      questionId: q.questionId,
      questionText: q.questionText,
      category: q.category,
    })),
  });
});

/* ==========================================================================
   SUBMIT CANDIDATE ANSWER & GET REAL-TIME EVALUATION
   POST /api/interview/submit-answer
   ========================================================================== */
const submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId, questionId, candidateAnswer } = req.body;

  if (!sessionId || !questionId || candidateAnswer === undefined) {
    res.status(400);
    throw new Error("Session ID, Question ID, and Candidate Answer are required.");
  }

  const session = await InterviewSession.findOne({
    _id: sessionId,
    candidate: req.user.id,
  });

  if (!session) {
    res.status(404);
    throw new Error("Interview session not found.");
  }

  const qIndex = session.questions.findIndex((q) => q.questionId === questionId);
  if (qIndex === -1) {
    res.status(404);
    throw new Error("Question not found in this session.");
  }

  const targetQuestion = session.questions[qIndex];

  // Evaluate candidate answer with TRAO AI Engine
  const evaluation = await evaluateCandidateAnswer({
    questionText: targetQuestion.questionText,
    category: targetQuestion.category,
    candidateAnswer,
    domain: session.jobDomain,
    seniority: session.targetSeniority,
  });

  // Update question state
  session.questions[qIndex].candidateAnswer = candidateAnswer;
  session.questions[qIndex].aiScore = evaluation.score;
  session.questions[qIndex].aiFeedback = {
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    suggestedAnswer: evaluation.suggestedAnswer,
  };
  session.questions[qIndex].answeredAt = new Date();

  // Recalculate overall score across answered questions
  const answeredQuestions = session.questions.filter((q) => q.candidateAnswer.trim().length > 0);
  const totalScore = answeredQuestions.reduce((acc, q) => acc + q.aiScore, 0);
  session.overallScore = Math.round(totalScore / (answeredQuestions.length || 1));

  // Mark complete if all questions answered
  if (answeredQuestions.length === session.questions.length) {
    session.status = "completed";
  }

  await session.save();

  res.status(200).json({
    message: "Answer evaluated successfully.",
    evaluation: {
      questionId,
      score: evaluation.score,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      suggestedAnswer: evaluation.suggestedAnswer,
    },
    overallScore: session.overallScore,
    sessionStatus: session.status,
  });
});

/* ==========================================================================
   GET CANDIDATE INTERVIEW HISTORY & SCORECARDS
   GET /api/interview/history
   ========================================================================== */
const getSessionHistory = asyncHandler(async (req, res) => {
  const sessions = await InterviewSession.find({ candidate: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    sessions,
  });
});

/* ==========================================================================
   GET SINGLE INTERVIEW SESSION DETAILS
   GET /api/interview/session/:id
   ========================================================================== */
const getSessionDetails = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findOne({
    _id: req.params.id,
    candidate: req.user.id,
  }).lean();

  if (!session) {
    res.status(404);
    throw new Error("Interview session not found.");
  }

  res.status(200).json({
    session,
  });
});

module.exports = {
  startInterviewSession,
  submitAnswer,
  getSessionHistory,
  getSessionDetails,
};
