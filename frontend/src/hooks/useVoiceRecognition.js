import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { DHRUV_MIC_ACCESS_NOTICE_KEY } from "../Services/authUtils";
import {
  createSpeakerEmbedding,
  getVoiceProfile,
  matchesVoiceProfile,
  startSpeakerAudioCapture,
} from "../Services/voiceIdentity";
import { getDhruvRealtimeScribeToken } from "../Services/jobService";

const getSpeechRecognitionClass = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const encodePcmChunk = (audio) => {
  const pcm = new Int16Array(audio.length);
  for (let index = 0; index < audio.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, audio[index]));
    pcm[index] = sample < 0 ? sample * 32768 : sample * 32767;
  }
  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
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
  const isSupported = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof (window.AudioContext || window.webkitAudioContext) !== "undefined";

  const regularAudioCaptureRef = useRef(null);
  const transcriptionSocketRef = useRef(null);
  const audioChunkCallbackRef = useRef(null);
  const fallbackSessionRef = useRef(0);
  const committedTranscriptRef = useRef("");
  const wakeRecognitionRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const onEndCallbackRef = useRef(null);
  const onWakeDetectedCallbackRef = useRef(null);
  const onWakeStatusCallbackRef = useRef(null);

  // Stop regular listening
  const stopListening = useCallback((shouldFinalize = false) => {
    ++fallbackSessionRef.current;
    const audioCapture = regularAudioCaptureRef.current;
    regularAudioCaptureRef.current = null;
    if (audioCapture) audioCapture.stop().catch((err) => console.warn("[VoiceRecognition] Audio capture stop error:", err));
    audioChunkCallbackRef.current = null;
    const socket = transcriptionSocketRef.current;
    transcriptionSocketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    setIsListening(false);
    if (shouldFinalize && committedTranscriptRef.current) {
      onResultCallbackRef.current?.(committedTranscriptRef.current);
    }
    onEndCallbackRef.current?.();
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

  // Stream microphone audio to ElevenLabs and show partial transcripts while speaking.
  const startListening = useCallback(
    async ({ onResult, onEnd } = {}) => {
      if (!isSupported) {
        toast.error("Audio recording is not supported in this browser.");
        return;
      }

      // Stop any existing session or wake listener first
      stopListening();
      stopWakeWord();
      setError(null);
      setTranscript("");
      setInterimTranscript("");
      committedTranscriptRef.current = "";

      onResultCallbackRef.current = onResult;
      onEndCallbackRef.current = onEnd;
      const sessionId = ++fallbackSessionRef.current;
      setIsListening(true);
      const connectingToast = "dhruv-realtime-transcription";
      toast.loading("Connecting to live transcription...", { id: connectingToast });
      try {
        const capture = await startSpeakerAudioCapture(30, (audio) => audioChunkCallbackRef.current?.(audio));
        if (fallbackSessionRef.current !== sessionId) {
          await capture.stop();
          return;
        }
        regularAudioCaptureRef.current = capture;
        const { token } = await getDhruvRealtimeScribeToken();
        if (fallbackSessionRef.current !== sessionId) return;

        const params = new URLSearchParams({
          model_id: "scribe_v2_realtime",
          token,
          audio_format: `pcm_${capture.sampleRate}`,
          sample_rate: String(capture.sampleRate),
          commit_strategy: "vad",
        });
        const socket = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params}`);
        transcriptionSocketRef.current = socket;
        let sessionStarted = false;
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Live transcription took too long to connect.")), 12000);
          socket.onmessage = (event) => {
            if (fallbackSessionRef.current !== sessionId) return;
            try {
              const message = JSON.parse(event.data);
              if (message.message_type === "session_started") {
                sessionStarted = true;
                clearTimeout(timeout);
                audioChunkCallbackRef.current = (audio) => {
                  if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ message_type: "input_audio_chunk", audio_base_64: encodePcmChunk(audio) }));
                  }
                };
                toast.dismiss(connectingToast);
                resolve();
              } else if (message.message_type === "partial_transcript") {
                setInterimTranscript([committedTranscriptRef.current, message.text].filter(Boolean).join(" "));
              } else if (message.message_type === "committed_transcript") {
                committedTranscriptRef.current = [committedTranscriptRef.current, message.text].filter(Boolean).join(" ").trim();
                setTranscript(committedTranscriptRef.current);
                setInterimTranscript(committedTranscriptRef.current);
              } else if (message.error || message.message_type?.endsWith("error") || message.message_type === "rate_limited") {
                throw new Error(message.error || "Live transcription failed. Please try again.");
              }
            } catch (error) {
              clearTimeout(timeout);
              if (sessionStarted) {
                setError(error.message);
                toast.error(error.message);
                stopListening();
              } else {
                reject(error);
              }
            }
          };
          socket.onerror = () => {
            clearTimeout(timeout);
            const error = new Error("Could not connect to ElevenLabs live transcription. Check your connection and try again.");
            if (sessionStarted) {
              setError(error.message);
              toast.error(error.message);
              stopListening();
            } else {
              reject(error);
            }
          };
          socket.onclose = () => {
            clearTimeout(timeout);
            if (fallbackSessionRef.current === sessionId) {
              const error = new Error("Live transcription connection closed.");
              if (sessionStarted) {
                setError(error.message);
                toast.error(error.message);
                stopListening();
              } else {
                reject(error);
              }
            }
          };
        });
      } catch (captureError) {
        if (fallbackSessionRef.current !== sessionId) return;
        toast.dismiss(connectingToast);
        regularAudioCaptureRef.current?.stop();
        regularAudioCaptureRef.current = null;
        transcriptionSocketRef.current?.close();
        transcriptionSocketRef.current = null;
        audioChunkCallbackRef.current = null;
        setIsListening(false);
        const message = captureError.response?.data?.message || captureError.message || "Could not start live transcription.";
        setError(message);
        toast.error(message);
      }
    },
    [isSupported, stopListening, stopWakeWord]
  );

  // Background Wake Word Detection ("Hey Dhruv", "Dhruv", "OK Dhruv")
  const listenForWakeWord = useCallback(
    (onWakeWordDetected, onWakeStatus) => {
      if (!SpeechRecognitionClass || !isSupported) return;

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
          let shouldShowNotice = true;
          try {
            shouldShowNotice = localStorage.getItem(DHRUV_MIC_ACCESS_NOTICE_KEY) !== "true";
            if (shouldShowNotice) localStorage.setItem(DHRUV_MIC_ACCESS_NOTICE_KEY, "true");
          } catch {
            // Keep the notice de-duplicated by toast ID when storage is unavailable.
          }
          if (shouldShowNotice) {
            toast.error("DHRUV needs microphone access to match your enrolled voice.", {
              id: DHRUV_MIC_ACCESS_NOTICE_KEY,
            });
          }
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
