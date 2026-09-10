import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "dhruv_tts_muted";

// Sanitizes markdown and technical artifacts for clean voice reading
export function sanitizeForSpeech(text) {
  if (!text) return "";

  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown links [Label](url) -> Label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove bold and italics **text** or *text*
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    // Remove markdown headers #, ##, ###
    .replace(/^#{1,6}\s+/gm, "")
    // Replace bullet points • or - with a pause comma
    .replace(/^[•\-\*]\s+/gm, "")
    // Remove raw HTML tags
    .replace(/<[^>]+>/g, "")
    // Replace multiple newlines with single periods for natural pauses
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    // Collapse excess whitespace
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const utteranceRef = useRef(null);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Stop any active speech immediately
  const stop = useCallback(() => {
    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn("[TextToSpeech] Cancel error:", err);
      }
    }
    setIsSpeaking(false);
  }, [isSupported]);

  // Toggle audio readback mute state
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch (e) {
        console.warn(e);
      }
      if (next) {
        stop();
      }
      return next;
    });
  }, [stop]);

  // Speak synthesized text
  const speak = useCallback(
    (text, onFinished) => {
      if (!isSupported || isMuted || !text) return;

      const cleanedText = sanitizeForSpeech(text);
      if (!cleanedText) return;

      // Stop previous utterance
      stop();

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Pick the best available English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("David"))) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          null;

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          if (onFinished) onFinished();
        };

        utterance.onerror = (event) => {
          // 'canceled' is expected when stopping speech
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
    [isSupported, isMuted, stop]
  );

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSpeaking,
    isMuted,
    isSupported,
    speak,
    stop,
    toggleMute,
  };
}
