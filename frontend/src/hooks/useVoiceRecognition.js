import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const getSpeechRecognitionClass = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export default function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isWakeListening, setIsWakeListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);

  const SpeechRecognitionClass = getSpeechRecognitionClass();
  const isSupported = Boolean(SpeechRecognitionClass);

  const recognitionRef = useRef(null);
  const wakeRecognitionRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const onWakeDetectedCallbackRef = useRef(null);

  // Stop regular listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("[VoiceRecognition] stop error:", err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  // Stop wake word listening
  const stopWakeWord = useCallback(() => {
    if (wakeRecognitionRef.current) {
      try {
        wakeRecognitionRef.current.onend = null;
        wakeRecognitionRef.current.onerror = null;
        wakeRecognitionRef.current.abort();
      } catch (err) {
        console.warn("[VoiceRecognition] wake stop error:", err);
      }
      wakeRecognitionRef.current = null;
    }
    setIsWakeListening(false);
  }, []);

  // Start regular speech recognition (Speech-to-Text)
  const startListening = useCallback(
    ({ onResult, onEnd, continuous = false, lang = "en-US" } = {}) => {
      if (!isSupported) {
        toast.error("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
      }

      // Stop any existing session or wake listener first
      stopListening();
      stopWakeWord();
      setError(null);
      setTranscript("");
      setInterimTranscript("");

      onResultCallbackRef.current = onResult;

      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = lang;
        recognition.interimResults = true;
        recognition.continuous = continuous;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let currentInterim = "";
          let currentFinal = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const item = event.results[i];
            const text = item[0]?.transcript || "";
            if (item.isFinal) {
              currentFinal += text;
            } else {
              currentInterim += text;
            }
          }

          if (currentInterim) {
            setInterimTranscript(currentInterim);
          }

          if (currentFinal) {
            const trimmed = currentFinal.trim();
            setTranscript(trimmed);
            setInterimTranscript("");
            if (onResultCallbackRef.current) {
              onResultCallbackRef.current(trimmed);
            }
          }
        };

        recognition.onerror = (event) => {
          console.warn("[VoiceRecognition] Error event:", event.error);
          setIsListening(false);
          setInterimTranscript("");

          if (event.error === "not-allowed") {
            setError("Microphone permission denied");
            toast.error("Microphone access was blocked. Please enable microphone permissions in your browser address bar.");
          } else if (event.error === "no-speech") {
            // Non-critical, user just didn't speak
            setError("No speech detected");
          } else if (event.error === "network") {
            setError("Network error in speech recognition");
            toast.error("Speech service network error. Check your connection.");
          } else {
            setError(event.error);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
          if (onEnd) onEnd();
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("[VoiceRecognition] Failed to start:", err);
        setIsListening(false);
        setError(err.message);
      }
    },
    [isSupported, SpeechRecognitionClass, stopListening, stopWakeWord]
  );

  // Background Wake Word Detection ("Hey Dhruv", "Dhruv", "OK Dhruv")
  const listenForWakeWord = useCallback(
    (onWakeWordDetected) => {
      if (!isSupported) return;

      stopWakeWord();
      stopListening();
      onWakeDetectedCallbackRef.current = onWakeWordDetected;

      try {
        const wakeRec = new SpeechRecognitionClass();
        wakeRec.lang = "en-US";
        wakeRec.continuous = true;
        wakeRec.interimResults = true;
        wakeRec.maxAlternatives = 1;

        wakeRec.onstart = () => {
          setIsWakeListening(true);
        };

        wakeRec.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = (event.results[i][0]?.transcript || "").trim().toLowerCase();

            // Match wake words
            const isWakeMatch =
              /^(hey\s+dhruv|dhruv|ok\s+dhruv|hello\s+dhruv)/i.test(text) ||
              text.includes("hey dhruv") ||
              text.includes("ok dhruv") ||
              text.includes("ask dhruv");

            if (isWakeMatch) {
              console.log("[VoiceRecognition] Wake word recognized:", text);
              // Stop wake recognition to free mic for the real prompt
              stopWakeWord();
              if (onWakeDetectedCallbackRef.current) {
                // Extract any prompt query uttered after the wake word
                const cleanQuery = text
                  .replace(/^(hey\s+dhruv|ok\s+dhruv|hello\s+dhruv|dhruv|ask\s+dhruv)[,.]?\s*/i, "")
                  .trim();
                onWakeDetectedCallbackRef.current(cleanQuery);
              }
              break;
            }
          }
        };

        wakeRec.onerror = (event) => {
          if (event.error === "not-allowed") {
            setIsWakeListening(false);
            console.warn("[VoiceRecognition] Wake word mic permission denied.");
          }
        };

        wakeRec.onend = () => {
          // Restart wake listener if it ended unexpectedly and still marked as wake listening
          if (wakeRecognitionRef.current) {
            try {
              wakeRec.start();
            } catch {
              setIsWakeListening(false);
            }
          } else {
            setIsWakeListening(false);
          }
        };

        wakeRecognitionRef.current = wakeRec;
        wakeRec.start();
      } catch (err) {
        console.warn("[VoiceRecognition] Could not start wake word detection:", err);
        setIsWakeListening(false);
      }
    },
    [isSupported, SpeechRecognitionClass, stopWakeWord, stopListening]
  );

  // Clean up all audio capture instances on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopWakeWord();
    };
  }, [stopListening, stopWakeWord]);

  return {
    isListening,
    isWakeListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    listenForWakeWord,
    stopWakeWord,
  };
}
