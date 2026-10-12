const {
  startInterviewSession,
  submitAnswer,
  getSessionHistory,
} = require("../controllers/interviewController");
const User = require("../models/user");
const InterviewSession = require("../models/InterviewSession");

jest.mock("../models/user");
jest.mock("../models/InterviewSession");
jest.mock("../services/interviewAssistantService", () => ({
  generateInterviewQuestions: jest.fn().mockResolvedValue([
    { questionId: "q1", questionText: "Explain React hooks.", category: "technical" },
    { questionId: "q2", questionText: "Explain Node event loop.", category: "technical" },
    { questionId: "q3", questionText: "How do you handle conflict?", category: "behavioral" },
  ]),
  evaluateCandidateAnswer: jest.fn().mockResolvedValue({
    score: 85,
    strengths: ["Clear explanation"],
    improvements: ["Mention performance optimization"],
    suggestedAnswer: "Use React.memo for re-render control.",
  }),
}));

describe("Interview Controller Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "user123" },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test("startInterviewSession initializes session successfully", async () => {
    User.findById.mockResolvedValue({
      _id: "user123",
      field: "Software Engineering",
      targetSeniority: ["Entry Level"],
      skills: ["React", "Node.js"],
    });

    InterviewSession.create.mockResolvedValue({
      _id: "session123",
      candidate: "user123",
      jobDomain: "Software Engineering",
      targetSeniority: "Entry Level",
      interviewType: "mixed",
      questions: [
        { questionId: "q1", questionText: "Explain React hooks.", category: "technical" },
      ],
      status: "in_progress",
    });

    await startInterviewSession(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "TRAO AI Interview Session initialized.",
        sessionId: "session123",
      })
    );
  });

  test("submitAnswer evaluates candidate answer and updates session score", async () => {
    req.body = {
      sessionId: "session123",
      questionId: "q1",
      candidateAnswer: "React hooks allow state management in functional components.",
    };

    const mockSession = {
      _id: "session123",
      candidate: "user123",
      jobDomain: "Software Engineering",
      targetSeniority: "Entry Level",
      questions: [
        {
          questionId: "q1",
          questionText: "Explain React hooks.",
          category: "technical",
          candidateAnswer: "",
          aiScore: 0,
          aiFeedback: {},
        },
      ],
      overallScore: 0,
      status: "in_progress",
      save: jest.fn().mockResolvedValue(true),
    };

    InterviewSession.findOne.mockResolvedValue(mockSession);

    await submitAnswer(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Answer evaluated successfully.",
        overallScore: 85,
        sessionStatus: "completed",
      })
    );
  });

  test("getSessionHistory returns candidate interview sessions", async () => {
    InterviewSession.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: "session123", overallScore: 85, status: "completed" },
        ]),
      }),
    });

    await getSessionHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      sessions: [{ _id: "session123", overallScore: 85, status: "completed" }],
    });
  });

  test("getSessionDetails returns single session object", async () => {
    req.params = { id: "session123" };
    InterviewSession.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: "session123",
        jobDomain: "Software Engineering",
        overallScore: 85,
      }),
    });

    const { getSessionDetails } = require("../controllers/interviewController");
    await getSessionDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      session: {
        _id: "session123",
        jobDomain: "Software Engineering",
        overallScore: 85,
      },
    });
  });
});
