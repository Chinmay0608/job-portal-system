import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY_MUTED = "dhruv_tts_muted";
const STORAGE_KEY_VOICE  = "dhruv_voice_key"; // "male" | "female" | "neural"

// ── Voice preset definitions ──────────────────────────────────────────────────
// Each preset is tried in priority order against available browser voices.
export const VOICE_PRESETS = [
  {
    key: "female",
    label: "Female",
    emoji: "👩",
    // Ordered preference list – first match wins
    nameHints: ["Google US English", "Samantha", "Victoria", "Karen", "Moira", "Fiona",
                 "Google UK English Female", "Microsoft Zira", "Microsoft Eva"],
    genderHint: "female",
    pitch: 1.1,
    rate: 1.0,
  },
  {
    key: "male",
    label: "Male",
    emoji: "👨",
    nameHints: ["Google UK English Male", "David", "Daniel", "Alex", "Fred",
                 "Microsoft David", "Microsoft Mark", "Google US English Male"],
    genderHint: "male",
    pitch: 0.95,
    rate: 1.0,
  },
  {
    key: "neural",
    label: "Neural",
    emoji: "🤖",
    nameHints: ["Natural", "Neural", "Wavenet", "Premium", "Enhanced",
                 "Google US English", "Samantha"],
    genderHint: null,   // any gender – pick highest quality
    pitch: 1.0,
    rate: 1.0,
  },
];

/** Pick the best matching SpeechSynthesisVoice for a preset. */
function pickVoice(preset, voices) {
  const englishVoices = voices.filter(v => v.lang.startsWith("en"));
  if (!englishVoices.length) return null;

  // Try name hints in priority order
  for (const hint of preset.nameHints) {
    const match = englishVoices.find(v =>
      v.name.toLowerCase().includes(hint.toLowerCase())
    );
    if (match) return match;
  }

  // Fall back to any English voice
  return englishVoices[0] || null;
}

// Sanitizes markdown and technical artifacts for clean voice reading
export function sanitizeForSpeech(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[•\-\*]\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isMuted, setIsMuted]         = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_MUTED) === "true"; }
    catch { return false; }
  });
  const [voiceKey, setVoiceKeyState]  = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY_VOICE) || "female"; }
    catch { return "female"; }
  });
  // Actual loaded browser voices (async on some browsers)
  const [voices, setVoices]           = useState([]);

  const utteranceRef = useRef(null);
  const isSupported  = typeof window !== "undefined" && "speechSynthesis" in window;

  // Load voices (they arrive asynchronously on Chrome)
  useEffect(() => {
    if (!isSupported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      try { window.speechSynthesis.cancel(); }
      catch (err) { console.warn("[TextToSpeech] Cancel error:", err); }
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY_MUTED, String(next)); }
      catch (e) { console.warn(e); }
      if (next) stop();
      return next;
    });
  }, [stop]);

  /** Change and persist the active voice preset key */
  const setVoiceKey = useCallback((key) => {
    const validKey = VOICE_PRESETS.find(p => p.key === key)?.key || "female";
    setVoiceKeyState(validKey);
    try { localStorage.setItem(STORAGE_KEY_VOICE, validKey); }
    catch (e) { console.warn(e); }
  }, []);

  const speak = useCallback(
    (text, onFinished) => {
      if (!isSupported || isMuted || !text) return;
      const cleanedText = sanitizeForSpeech(text);
      if (!cleanedText) return;

      stop();

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = "en-US";

        const preset = VOICE_PRESETS.find(p => p.key === voiceKey) || VOICE_PRESETS[0];
        utterance.pitch = preset.pitch;
        utterance.rate  = preset.rate;

        const selectedVoice = pickVoice(preset, voices);
        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend   = () => {
          setIsSpeaking(false);
          if (onFinished) onFinished();
        };
        utterance.onerror = (event) => {
          if (event.error !== "canceled" && event.error !== "interrupted") {
            console.warn("[TextToSpeech] Utterance error:", event.error);
          }
          setIsSpeaking(false);
          if (onFinished) onFinished();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[TextToSpeech] Synthesis failed:", err);
        setIsSpeaking(false);
      }
    },
    [isSupported, isMuted, stop, voiceKey, voices]
  );

  useEffect(() => () => stop(), [stop]);

  return {
    isSpeaking,
    isMuted,
    isSupported,
    speak,
    stop,
    toggleMute,
    voiceKey,
    setVoiceKey,
    voicePresets: VOICE_PRESETS,
  };
}
