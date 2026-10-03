const { calculateRelevanceScore } = require("../services/relevanceEngine");

describe("relevanceEngine Utility (gcc-job-radar port)", () => {
  it("should calculate high match score (80%+) for matching domain, level, and skills", () => {
    const user = {
      field: "Software Engineering",
      targetSeniority: ["Entry Level", "SDE-1"],
      skills: ["React", "Node.js", "MongoDB"],
    };

    const job = {
      title: "Junior React & Node.js Developer",
      description: "Build modern web apps with React, Node.js and MongoDB.",
      domain: "Software Engineering",
      seniorityLevel: "Entry Level",
      isRemote: true,
    };

    const score = calculateRelevanceScore(job, user);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should penalize score when seniority level does not match candidate preferences", () => {
    const user = {
      field: "Software Engineering",
      targetSeniority: ["Entry Level"],
      skills: ["React"],
    };

    const job = {
      title: "Principal Staff Software Architect",
      description: "Lead enterprise system architecture.",
      domain: "Software Engineering",
      seniorityLevel: "Principal / Staff",
    };

    const score = calculateRelevanceScore(job, user);
    expect(score).toBeLessThan(60);
  });

  it("should handle missing user or job objects gracefully", () => {
    expect(calculateRelevanceScore(null, null)).toBe(50);
  });
});
