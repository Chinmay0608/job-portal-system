const axios = require("axios");
const asyncHandler = require("express-async-handler");
const logger = require("../utils/logger");

const VOICE_IDS = {
  female: process.env.ELEVENLABS_FEMALE_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
  male: process.env.ELEVENLABS_MALE_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
};

const synthesizeDhruvSpeech = asyncHandler(async (req, res) => {
  const { text, voice } = req.body || {};

  if (typeof text !== "string" || !text.trim() || text.length > 5000) {
    return res.status(400).json({ message: "Text must contain 1 to 5000 characters" });
  }
  if (!Object.hasOwn(VOICE_IDS, voice)) {
    return res.status(400).json({ message: "Choose a supported voice" });
  }
  if (!process.env.ELEVEN_API_KEY) {
    return res.status(503).json({ message: "DHRUV voice service is not configured" });
  }

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_IDS[voice]}`,
      {
        text: text.trim(),
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        responseType: "arraybuffer",
        timeout: 30000,
      }
    );

    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "no-store");
    return res.status(200).send(Buffer.from(response.data));
  } catch (error) {
    logger.error({ status: error.response?.status }, "[ElevenLabs] Speech generation failed");
    return res.status(502).json({ message: "DHRUV could not generate voice audio. Please try again." });
  }
});

const createRealtimeScribeToken = asyncHandler(async (_req, res) => {
  if (!process.env.ELEVEN_API_KEY) {
    return res.status(503).json({ message: "DHRUV speech recognition is not configured" });
  }
  try {
    const response = await axios.post("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", null, {
      headers: { "xi-api-key": process.env.ELEVEN_API_KEY },
      timeout: 15000,
    });
    if (!response.data?.token) throw new Error("ElevenLabs returned no realtime token");
    return res.json({ token: response.data?.token });
  } catch (error) {
    logger.error({ status: error.response?.status }, "[ElevenLabs] Realtime speech token request failed");
    return res.status(502).json({ message: "DHRUV could not start live transcription. Please try again." });
  }
});

module.exports = { synthesizeDhruvSpeech, createRealtimeScribeToken };
