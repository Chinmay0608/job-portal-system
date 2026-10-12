import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { synthesizeDhruvSpeech } from "../Services/jobService";

const STORAGE_KEY_MUTED = "dhruv_tts_muted";
const STORAGE_KEY_VOICE  = "dhruv_voice_key";

export const VOICE_PRESETS = [
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
];

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
    .replace(/^[•*-]\s+/gm, "")
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
    try { return localStorage.getItem(STORAGE_KEY_VOICE) === "male" ? "male" : "female"; }
    catch { return "female"; }
  });
  const audioRef = useRef(null);
  const playbackRequestRef = useRef(0);
  const isSupported = typeof window !== "undefined" && "Audio" in window;

  const stop = useCallback(() => {
    playbackRequestRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); }
      catch (err) { console.warn("[TextToSpeech] Cancel error:", err); }
    }
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      if (audio.src.startsWith("blob:")) URL.revokeObjectURL(audio.src);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

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
    async (text, onFinished) => {
      if (!isSupported || isMuted || !text) return;
      const cleanedText = sanitizeForSpeech(text);
      if (!cleanedText) return;

      stop();
      const playbackRequest = playbackRequestRef.current;
      setIsSpeaking(true);

      try {
        const audioBlob = await synthesizeDhruvSpeech({
          text: cleanedText,
          voice: voiceKey === "male" ? "male" : "female",
        });
        if (isMuted || playbackRequest !== playbackRequestRef.current) return;

        const audio = new Audio(URL.createObjectURL(audioBlob));
        audioRef.current = audio;
        audio.onended = () => {
          audioRef.current = null;
          URL.revokeObjectURL(audio.src);
          setIsSpeaking(false);
          if (onFinished) onFinished();
        };
        audio.onerror = () => {
          audioRef.current = null;
          URL.revokeObjectURL(audio.src);
          setIsSpeaking(false);
          toast.error("DHRUV audio playback failed. Please try again.");
          if (onFinished) onFinished();
        };

        await audio.play();
      } catch (err) {
        console.warn("[TextToSpeech] Synthesis failed:", err);
        if (playbackRequest !== playbackRequestRef.current) return;
        setIsSpeaking(false);
        let errorMessage = "DHRUV could not speak right now. Please try again.";
        if (err.response?.data instanceof Blob) {
          try {
            const response = JSON.parse(await err.response.data.text());
            if (typeof response.message === "string") errorMessage = response.message;
          } catch (parseError) {
            console.warn("[TextToSpeech] Could not read speech service error:", parseError);
          }
        }
        toast.error(errorMessage);
        if (onFinished) onFinished();
      }
    },
    [isSupported, isMuted, stop, voiceKey]
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
