jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("../utils/logger", () => ({ error: jest.fn() }));

const axios = require("axios");
const { synthesizeDhruvSpeech } = require("../controllers/speechController");

describe("synthesizeDhruvSpeech", () => {
  let req;
  let res;
  const originalApiKey = process.env.ELEVEN_API_KEY;

  beforeEach(() => {
    process.env.ELEVEN_API_KEY = "test-api-key";
    req = { body: { text: "Hello", voice: "female" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    axios.post.mockReset();
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.ELEVEN_API_KEY;
    else process.env.ELEVEN_API_KEY = originalApiKey;
  });

  it.each([
    ["female", "21m00Tcm4TlvDq8ikWAM"],
    ["male", "pNInz6obpgDQGcFmaJgB"],
  ])("uses the selected %s voice and keeps the API key server-side", async (voice, voiceId) => {
    req.body.voice = voice;
    axios.post.mockResolvedValue({ data: Buffer.from("audio") });

    await synthesizeDhruvSpeech(req, res);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining(`/${voiceId}`),
      expect.objectContaining({ text: "Hello", model_id: "eleven_multilingual_v2" }),
      expect.objectContaining({
        headers: expect.objectContaining({ "xi-api-key": "test-api-key" }),
        responseType: "arraybuffer",
      })
    );
    expect(res.set).toHaveBeenCalledWith("Content-Type", "audio/mpeg");
    expect(res.send).toHaveBeenCalledWith(Buffer.from("audio"));
  });

  it("rejects invalid text or voice before calling ElevenLabs", async () => {
    req.body = { text: "", voice: "unknown" };

    await synthesizeDhruvSpeech(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
