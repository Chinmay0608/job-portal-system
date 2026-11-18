const {
  classifyResponse,
  getNextAlertAt,
  isMatchingJobPage,
  makeSummary,
  parseArgs,
} = require("../scripts/auditJobLinks");

describe("job link audit", () => {
  test("only marks 404 and 410 as stale by status", () => {
    expect(classifyResponse({ status: 404 }).verdict).toBe("stale");
    expect(classifyResponse({ status: 410 }).verdict).toBe("stale");
    expect(classifyResponse({ status: 403 }).verdict).toBe("inconclusive");
    expect(classifyResponse({ status: 503 }).verdict).toBe("inconclusive");
  });

  test("requires a matching job title for a closed-message result", () => {
    expect(
      classifyResponse({
        status: 200,
        title: "Software Engineer",
        html: "<title>Software Engineer</title><p>This position is no longer available.</p>",
      }),
    ).toEqual({ verdict: "stale", reason: "matching_job_closed_message" });
    expect(
      classifyResponse({
        status: 200,
        title: "Software Engineer",
        html: "<title>Product Designer</title><p>This position is no longer available.</p>",
      }),
    ).toEqual({
      verdict: "inconclusive",
      reason: "closed_marker_job_identity_unconfirmed",
    });
  });

  test("does not mark an ordinary successful page stale", () => {
    expect(
      classifyResponse({
        status: 200,
        title: "Software Engineer",
        html: "<title>Software Engineer</title><p>Apply for this role today.</p>",
      }),
    ).toEqual({ verdict: "not_confirmed_stale", reason: "no_closed_marker" });
  });

  test("validates title matching and resumable scan options", () => {
    expect(
      isMatchingJobPage("Software Engineer Remote", "Software Engineer"),
    ).toBe(true);
    expect(
      isMatchingJobPage("Product Designer Remote", "Software Engineer"),
    ).toBe(false);
    expect(
      parseArgs([
        "--concurrency=4",
        "--delay-ms=1000",
        "--limit=5",
        "--output=audit.jsonl",
      ]),
    ).toEqual({
      concurrency: 4,
      delayMs: 1000,
      limit: 5,
      output: "audit.jsonl",
    });
  });

  test("counts job records rather than just unique links", () => {
    const summary = makeSummary(
      [
        { verdict: "stale", jobs: [{}, {}] },
        { verdict: "inconclusive", jobs: [{}] },
      ],
      4,
      "audit.jsonl",
    );
    expect(summary).toEqual(
      expect.objectContaining({
        stale: 2,
        inconclusive: 1,
        checkedUrls: 2,
        checkedJobRecords: 3,
        totalJobRecords: 4,
      }),
    );
  });

  test("sets alerts at consecutive 500-link checkpoints", () => {
    expect([0, 499, 500, 999, 1000, 2904].map(getNextAlertAt)).toEqual([
      500, 500, 1000, 1000, 1500, 3000,
    ]);
  });
});
