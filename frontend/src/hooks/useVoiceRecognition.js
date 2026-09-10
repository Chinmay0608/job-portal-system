import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const getSpeechRecognitionClass = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

// Play crystal-clear Siri/Alexa-style ascending wake chime using native Web Audio API
export const playWakeChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.12);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.09, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.26);
  } catch (e) {
    // Gracefully handle browser audio restrictions
  }
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

  const wakeRestartTimerRef = useRef(null);
  const activeWakeRef = useRef(false);

  // Stop wake word listening
  const stopWakeWord = useCallback(() => {
    activeWakeRef.current = false;
    if (wakeRestartTimerRef.current) {
      clearTimeout(wakeRestartTimerRef.current);
      wakeRestartTimerRef.current = null;
    }
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
      activeWakeRef.current = true;
      onWakeDetectedCallbackRef.current = onWakeWordDetected;

      const startWakeSession = () => {
        if (!activeWakeRef.current || !SpeechRecognitionClass) return;

        if (wakeRestartTimerRef.current) {
          clearTimeout(wakeRestartTimerRef.current);
          wakeRestartTimerRef.current = null;
        }

        try {
          const wakeRec = new SpeechRecognitionClass();
          wakeRec.lang = "en-US";
          wakeRec.continuous = true;
          wakeRec.interimResults = true;
          wakeRec.maxAlternatives = 1;

          wakeRec.onstart = () => {
            if (activeWakeRef.current) {
              setIsWakeListening(true);
            }
          };

          wakeRec.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const rawText = (event.results[i][0]?.transcript || "").trim();
              if (!rawText) continue;

              // Clean text: strip punctuation and collapse whitespace so 'Hey, Dhruv!' becomes 'hey dhruv'
              const cleanText = rawText.toLowerCase().replace(/[^a-z0-9\s]/gi, " ").replace(/\s+/g, " ").trim();

              // Flexible regex: matches 'hey dhruv', 'hi dhruv', 'hello dhruv', 'ok dhruv', 'dhruv',
              // as well as common speech engine phonetics for 'Dhruv' ('druv', 'dhruva', 'drew', 'droov', 'dhrub', 'dhru', 'dhroov')
              const WAKE_PATTERN = /\b(hey|hi|hello|ok|okay|ask)?\s*(dhruv|druv|dhruva|drew|droov|dhrub|dhru|dhroov)\b/i;

              if (WAKE_PATTERN.test(cleanText)) {
                console.log("[VoiceRecognition] Wake word recognized:", rawText);
                playWakeChime();
                stopWakeWord();
                if (onWakeDetectedCallbackRef.current) {
                  // Extract any question/query spoken after the wake word
                  const cleanQuery = cleanText.replace(WAKE_PATTERN, "").trim();
                  onWakeDetectedCallbackRef.current(cleanQuery);
                }
                break;
              }
            }
          };

          wakeRec.onerror = (event) => {
            console.debug("[VoiceRecognition] Wake event error:", event.error);
            if (event.error === "not-allowed") {
              activeWakeRef.current = false;
              setIsWakeListening(false);
              toast.error("Microphone access is blocked. Please allow microphone permission in your browser address bar to use 'Hey Dhruv'.", {
                id: "dhruv-mic-denied",
                duration: 6000,
              });
            }
          };

          wakeRec.onend = () => {
            wakeRecognitionRef.current = null;
            if (activeWakeRef.current) {
              // Rapidly recreate and restart session after an 80ms tick for zero-lag responsiveness
              wakeRestartTimerRef.current = setTimeout(() => {
                if (activeWakeRef.current) {
                  startWakeSession();
                }
              }, 80);
            } else {
              setIsWakeListening(false);
            }
          };

          wakeRecognitionRef.current = wakeRec;
          wakeRec.start();
        } catch (err) {
          console.warn("[VoiceRecognition] Could not start wake word session:", err);
          if (activeWakeRef.current) {
            wakeRestartTimerRef.current = setTimeout(() => {
              if (activeWakeRef.current) {
                startWakeSession();
              }
            }, 200);
          } else {
            setIsWakeListening(false);
          }
        }
      };

      startWakeSession();
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
