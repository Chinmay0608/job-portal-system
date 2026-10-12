jest.mock("../models/AiFeedback", () => ({ create: jest.fn() }));
jest.mock("../models/user", () => ({ findById: jest.fn() }));

const AiFeedback = require("../models/AiFeedback");
const { submitAiFeedback } = require("../controllers/feedbackController");

describe("DHRUV answer feedback", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        prompt: "How do I prepare?",
        response: "Practice regularly.",
        rating: "negative",
        feedbackReason: "unclear",
      },
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    AiFeedback.create.mockReset().mockResolvedValue({ _id: "feedback-id", rating: "negative" });
  });

  it("stores the selected reason for a negative rating", async () => {
    await submitAiFeedback(req, res);

    expect(AiFeedback.create).toHaveBeenCalledWith(expect.objectContaining({
      rating: "negative",
      feedbackReason: "unclear",
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("requires a valid reason for a negative rating", async () => {
    req.body.feedbackReason = "not-a-choice";

    await submitAiFeedback(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(AiFeedback.create).not.toHaveBeenCalled();
  });
});
