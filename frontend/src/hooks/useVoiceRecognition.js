import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  createSpeakerEmbedding,
  getVoiceProfile,
  matchesVoiceProfile,
  startSpeakerAudioCapture,
} from "../Services/voiceIdentity";

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
  const onWakeStatusCallbackRef = useRef(null);

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
  const wakeAudioCaptureRef = useRef(null);
  const wakeVerificationRef = useRef(false);
  const lastVoicePromptRef = useRef(0);

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
    const audioCapture = wakeAudioCaptureRef.current;
    wakeAudioCaptureRef.current = null;
    if (audioCapture) {
      audioCapture.stop().catch((err) => {
        console.warn("[VoiceRecognition] Audio capture stop error:", err);
      });
    }
    wakeVerificationRef.current = false;
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
    (onWakeWordDetected, onWakeStatus) => {
      if (!isSupported) return;

      stopWakeWord();
      stopListening();
      activeWakeRef.current = true;
      onWakeDetectedCallbackRef.current = onWakeWordDetected;
      onWakeStatusCallbackRef.current = onWakeStatus;

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
            const rawText = Array.from(event.results, (result) => result[0]?.transcript || "").join(" ").trim();
            if (!rawText) return;

            const cleanText = rawText.toLowerCase().replace(/[^a-z0-9\s]/gi, " ").replace(/\s+/g, " ").trim();
            const wakePattern = /\b(hey|hi|hello|ok|okay|ask)?\s*(dhruv|druv|dhruva|drew|droov|dhrub|dhru|dhroov)\b/i;

            if (wakePattern.test(cleanText) && !wakeVerificationRef.current) {
              const profile = getVoiceProfile();
              if (!profile) {
                if (Date.now() - lastVoicePromptRef.current > 8000) {
                  lastVoicePromptRef.current = Date.now();
                  onWakeStatusCallbackRef.current?.("profile-missing");
                  toast("Set up voice match in DHRUV before using the wake phrase.", {
                    id: "dhruv-voice-enrollment-needed",
                  });
                }
                return;
              }

              const audioCapture = wakeAudioCaptureRef.current;
              if (!audioCapture) {
                onWakeStatusCallbackRef.current?.("capture-unavailable");
                return;
              }
              wakeVerificationRef.current = true;
              const audio = audioCapture.getRecentAudio();
              const promptAfterWake = cleanText.replace(wakePattern, "").trim();
              const verificationToastId = "dhruv-voice-verification";
              onWakeStatusCallbackRef.current?.("checking");
              toast.loading("Checking your voice on this device...", { id: verificationToastId });

              void (async () => {
                try {
                  const embedding = await createSpeakerEmbedding(audio, audioCapture.sampleRate);
                  if (!activeWakeRef.current) return;
                  if (!matchesVoiceProfile(embedding, profile)) {
                    if (Date.now() - lastVoicePromptRef.current > 5000) {
                      lastVoicePromptRef.current = Date.now();
                      onWakeStatusCallbackRef.current?.("speaker-mismatch");
                      toast("I couldn't match that voice to your enrolled profile.");
                    }
                    return;
                  }
                  console.log("[VoiceRecognition] Enrolled speaker matched.");
                  playWakeChime();
                  stopWakeWord();
                  onWakeDetectedCallbackRef.current?.(promptAfterWake);
                } catch (err) {
                  console.error("[VoiceRecognition] Speaker verification failed:", err);
                  onWakeStatusCallbackRef.current?.("verification-error");
                  toast.error("DHRUV couldn't verify your voice. Please try again.");
                } finally {
                  toast.dismiss(verificationToastId);
                  wakeVerificationRef.current = false;
                }
              })();
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

      void startSpeakerAudioCapture().then((capture) => {
        if (!activeWakeRef.current) {
          void capture.stop();
          return;
        }
        wakeAudioCaptureRef.current = capture;
        startWakeSession();
      }).catch((err) => {
        console.error("[VoiceRecognition] Could not capture audio for voice match:", err);
        if (activeWakeRef.current) {
          activeWakeRef.current = false;
          setIsWakeListening(false);
          toast.error("DHRUV needs microphone access to match your enrolled voice.");
        }
      });
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
