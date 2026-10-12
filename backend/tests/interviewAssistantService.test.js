const {
  generateInterviewQuestions,
  evaluateCandidateAnswer,
} = require("../services/interviewAssistantService");

describe("TRAO AI Interview Assistant Service", () => {
  test("generateInterviewQuestions returns 3 questions for Software Engineering", async () => {
    const questions = await generateInterviewQuestions({
      domain: "Software Engineering",
      seniority: "Mid Level",
      type: "technical",
      skills: ["React", "Node.js"],
    });

    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(3);
    expect(questions[0]).toHaveProperty("questionId");
    expect(questions[0]).toHaveProperty("questionText");
    expect(questions[0]).toHaveProperty("category");
  });

  test("generateInterviewQuestions returns domain-specific questions for Healthcare", async () => {
    const questions = await generateInterviewQuestions({
      domain: "Healthcare & Medical",
      seniority: "Specialist Physician",
      type: "situational",
    });

    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(3);
    expect(questions[0].questionText.toLowerCase()).toContain("clinical");
  });

  test("generateInterviewQuestions returns domain-specific questions for Media & Video", async () => {
    const questions = await generateInterviewQuestions({
      domain: "Media & Video Creation",
      seniority: "Senior Creator",
    });

    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(3);
    expect(questions[0].questionText.toLowerCase()).toContain("video");
  });

  test("evaluateCandidateAnswer handles short responses gracefully", async () => {
    const evaluation = await evaluateCandidateAnswer({
      questionText: "Explain how promises work in JavaScript.",
      candidateAnswer: "Short",
      domain: "Software Engineering",
      seniority: "Entry Level",
    });

    expect(evaluation.score).toBeLessThanOrEqual(50);
    expect(evaluation.improvements.length).toBeGreaterThan(0);
  });

  test("evaluateCandidateAnswer handles detailed responses", async () => {
    const evaluation = await evaluateCandidateAnswer({
      questionText: "How do you optimize a React app performance?",
      candidateAnswer:
        "I optimize React apps by using React.memo, useMemo, useCallback to prevent unnecessary re-renders, code splitting using React.lazy, lazy loading images, and profiling bundle size with Webpack Analyzer.",
      domain: "Software Engineering",
      seniority: "Mid Level",
    });

    expect(evaluation).toHaveProperty("score");
    expect(evaluation.score).toBeGreaterThanOrEqual(50);
    expect(Array.isArray(evaluation.strengths)).toBe(true);
    expect(Array.isArray(evaluation.improvements)).toBe(true);
  });
});
