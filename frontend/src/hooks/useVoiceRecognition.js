import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { startMicrophoneAudioCapture } from "../Services/audioCapture";
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
  const interimTranscriptRef = useRef("");
  const audioSampleRateRef = useRef(16000);
  const pendingAudioChunksRef = useRef([]);
  const hasSentAudioRef = useRef(false);
  const pendingFinalizeRef = useRef(false);
  const pendingFinalizeTimerRef = useRef(null);
  const completeStopRef = useRef(null);
  const wakeRecognitionRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const onEndCallbackRef = useRef(null);
  const onWakeDetectedCallbackRef = useRef(null);
  const wakeTriggeredRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.removeItem("dhruv_voice_profile_v1");
      localStorage.removeItem("dhruv_mic_access_notice_shown");
    } catch {
      // Voice matching data is obsolete; storage may be unavailable in private browsing.
    }
  }, []);

  // Stop regular listening
  const stopListening = useCallback((shouldFinalize = false) => {
    const audioCapture = regularAudioCaptureRef.current;
    regularAudioCaptureRef.current = null;
    if (audioCapture) audioCapture.stop().catch((err) => console.warn("[VoiceRecognition] Audio capture stop error:", err));
    audioChunkCallbackRef.current = null;
    const socket = transcriptionSocketRef.current;
    if (shouldFinalize && socket?.readyState === WebSocket.OPEN && hasSentAudioRef.current) {
      if (pendingFinalizeRef.current) return;
      pendingFinalizeRef.current = true;
      try {
        const sampleRate = audioSampleRateRef.current;
        socket.send(JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: encodePcmChunk(new Float32Array(Math.ceil(sampleRate * 0.1))),
          commit: true,
        }));
        pendingFinalizeTimerRef.current = setTimeout(() => completeStopRef.current?.(true), 1800);
        return;
      } catch (error) {
        console.warn("[VoiceRecognition] Could not finalize transcript:", error);
      }
    }
    completeStopRef.current?.(shouldFinalize);
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

  // Stream microphone audio to ElevenLabs and show partial transcripts while speaking.
  const startListening = useCallback(
    async ({ onResult, onEnd, keyterms = [] } = {}) => {
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
      interimTranscriptRef.current = "";
      pendingAudioChunksRef.current = [];
      hasSentAudioRef.current = false;
      pendingFinalizeRef.current = false;

      onResultCallbackRef.current = onResult;
      onEndCallbackRef.current = onEnd;
      const sessionId = ++fallbackSessionRef.current;
      setIsListening(true);
      audioChunkCallbackRef.current = (audio) => {
        const chunks = pendingAudioChunksRef.current;
        if (chunks.length >= 100) chunks.shift();
        chunks.push(new Float32Array(audio));
      };
      completeStopRef.current = (shouldFinalize = false) => {
        if (fallbackSessionRef.current !== sessionId) return;
        ++fallbackSessionRef.current;
        clearTimeout(pendingFinalizeTimerRef.current);
        pendingFinalizeTimerRef.current = null;
        pendingFinalizeRef.current = false;
        const capture = regularAudioCaptureRef.current;
        regularAudioCaptureRef.current = null;
        if (capture) capture.stop().catch((err) => console.warn("[VoiceRecognition] Audio capture stop error:", err));
        audioChunkCallbackRef.current = null;
        pendingAudioChunksRef.current = [];
        const activeSocket = transcriptionSocketRef.current;
        transcriptionSocketRef.current = null;
        if (activeSocket && activeSocket.readyState < WebSocket.CLOSING) activeSocket.close();
        setIsListening(false);
        const finalText = interimTranscriptRef.current || committedTranscriptRef.current;
        if (shouldFinalize && finalText.trim()) onResultCallbackRef.current?.(finalText.trim());
        onEndCallbackRef.current?.();
      };
      const connectingToast = "dhruv-realtime-transcription";
      toast.loading("Connecting to live transcription...", { id: connectingToast });
      try {
        const capture = await startMicrophoneAudioCapture((audio) => audioChunkCallbackRef.current?.(audio));
        if (fallbackSessionRef.current !== sessionId) {
          await capture.stop();
          return;
        }
        regularAudioCaptureRef.current = capture;
        audioSampleRateRef.current = capture.sampleRate;
        const { token } = await getDhruvRealtimeScribeToken();
        if (fallbackSessionRef.current !== sessionId) return;

        const params = new URLSearchParams({
          model_id: "scribe_v2_realtime",
          token,
          audio_format: `pcm_${capture.sampleRate}`,
          sample_rate: String(capture.sampleRate),
          commit_strategy: "manual",
        });
        keyterms.filter((term) => typeof term === "string" && term.trim()).slice(0, 50).forEach((term) => {
          params.append("keyterms", term.trim().slice(0, 20));
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
                    hasSentAudioRef.current = true;
                  }
                };
                pendingAudioChunksRef.current.splice(0).forEach((audio) => {
                  socket.send(JSON.stringify({ message_type: "input_audio_chunk", audio_base_64: encodePcmChunk(audio) }));
                  hasSentAudioRef.current = true;
                });
                toast.dismiss(connectingToast);
                resolve();
              } else if (message.message_type === "partial_transcript") {
                interimTranscriptRef.current = [committedTranscriptRef.current, message.text?.trim()].filter(Boolean).join(" ").trim();
                setInterimTranscript(interimTranscriptRef.current);
              } else if (message.message_type === "committed_transcript") {
                committedTranscriptRef.current = [committedTranscriptRef.current, message.text?.trim()].filter(Boolean).join(" ").trim();
                interimTranscriptRef.current = committedTranscriptRef.current;
                setTranscript(committedTranscriptRef.current);
                setInterimTranscript(committedTranscriptRef.current);
                if (pendingFinalizeRef.current) completeStopRef.current?.(true);
              } else if (message.error || message.message_type?.endsWith("error") || message.message_type === "rate_limited") {
                throw new Error(message.error || "Live transcription failed. Please try again.");
              }
            } catch (error) {
              clearTimeout(timeout);
              if (sessionStarted) {
                setError(error.message);
                toast.error(error.message);
                stopListening(pendingFinalizeRef.current);
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
              stopListening(pendingFinalizeRef.current);
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
                stopListening(pendingFinalizeRef.current);
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
        pendingAudioChunksRef.current = [];
        completeStopRef.current = null;
        setIsListening(false);
        const message = captureError.response?.data?.message || captureError.message || "Could not start live transcription.";
        setError(message);
        toast.error(message);
      }
    },
    [isSupported, stopListening, stopWakeWord]
  );

  // Background wake word detection ("Hey Dhruv", "Dhruv", "OK Dhruv")
  const listenForWakeWord = useCallback(
    (onWakeWordDetected) => {
      if (!SpeechRecognitionClass || !isSupported) return;

      stopWakeWord();
      stopListening();
      activeWakeRef.current = true;
      wakeTriggeredRef.current = false;
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
            const rawText = Array.from(event.results, (result) => result[0]?.transcript || "").join(" ").trim();
            if (!rawText) return;

            const cleanText = rawText.toLowerCase().replace(/[^a-z0-9\s]/gi, " ").replace(/\s+/g, " ").trim();
            const wakePattern = /\b(hey|hi|hello|ok|okay|ask)?\s*(dhruv|druv|dhruva|drew|droov|dhrub|dhru|dhroov)\b/i;

            if (wakePattern.test(cleanText) && !wakeTriggeredRef.current) {
              wakeTriggeredRef.current = true;
              const promptAfterWake = cleanText.replace(wakePattern, "").trim();
              playWakeChime();
              stopWakeWord();
              onWakeDetectedCallbackRef.current?.(promptAfterWake);
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
