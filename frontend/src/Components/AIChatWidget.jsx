import React, { useState, useRef, useEffect, useCallback } from "react";
import { HiSparkles, HiXMark, HiPaperAirplane, HiArrowPath } from "react-icons/hi2";
import { BsRobot, BsPerson } from "react-icons/bs";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles,
  Play,
  Square
} from "lucide-react";
import toast from "react-hot-toast";
import { postAIChatMessage } from "../Services/jobService";
import useVoiceRecognition from "../hooks/useVoiceRecognition";
import useTextToSpeech from "../hooks/useTextToSpeech";

const SUGGESTION_CHIPS = [
  "Analyze my skill gaps",
  "Recommend top jobs for my field",
  "Interview tips for my top match",
];

const renderFormattedContent = (content) => {
  if (!content) return null;
  const lines = content.split("\n");
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, partIndex) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={partIndex} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <React.Fragment key={lineIndex}>
        {formattedParts}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export default function AIChatWidget({ 
  user, 
  isOpen: externalIsOpen, 
  setIsOpen: externalSetIsOpen, 
  hideFloatingTrigger = false,
  autoStartVoice = false,
  initialQuery = ""
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(() => {
    try {
      return localStorage.getItem("dhruv_wake_word_enabled") !== "false";
    } catch {
      return true;
    }
  });
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // Dragging and movable card state
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });
  const cardRef = useRef(null);

  const handleDragStart = (e) => {
    // If target is an interactive element (button, input, select, link), do not drag
    if (e.target.closest("button, input, textarea, a, select")) {
      return;
    }

    const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    dragInfoRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      origX: rect.left,
      origY: rect.top,
    };

    setIsDragging(true);
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!dragInfoRef.current.isDragging || !cardRef.current) return;

      const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragInfoRef.current.startX;
      const deltaY = clientY - dragInfoRef.current.startY;

      const cardRect = cardRef.current.getBoundingClientRect();
      const cardWidth = cardRect.width;
      const cardHeight = cardRect.height;

      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - cardWidth - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - cardHeight - 8);

      const targetX = Math.min(Math.max(dragInfoRef.current.origX + deltaX, minX), maxX);
      const targetY = Math.min(Math.max(dragInfoRef.current.origY + deltaY, minY), maxY);

      setPosition({ x: targetX, y: targetY });

      // Prevent scrolling on touch screens while dragging the card
      if (e.cancelable && e.type.startsWith("touch")) {
        e.preventDefault();
      }
    };

    const handleDragEnd = () => {
      if (dragInfoRef.current.isDragging) {
        dragInfoRef.current.isDragging = false;
        setIsDragging(false);
      }
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);

    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, []);

  // Ensure card stays within viewport when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (!cardRef.current || position.x === null) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      const maxX = Math.max(8, window.innerWidth - cardRect.width - 8);
      const maxY = Math.max(8, window.innerHeight - cardRect.height - 8);

      setPosition((prev) => {
        if (prev.x === null) return prev;
        return {
          x: Math.min(Math.max(prev.x, 8), maxX),
          y: Math.min(Math.max(prev.y, 8), maxY),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position.x]);

  const handleHeaderDoubleClick = () => {
    setPosition({ x: null, y: null });
  };

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${user?.name || "there"}! I'm **DHRUV**, your SkillBridge AI Career Coach.\n\nHere are some options to get started:`,
      isWelcome: true,
    },
  ]);

  const chatEndRef = useRef(null);
  const voiceRec = useVoiceRecognition();
  const tts = useTextToSpeech();

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Update input text with interim speech while candidate is talking
  useEffect(() => {
    if (voiceRec.isListening && voiceRec.interimTranscript) {
      setInput(voiceRec.interimTranscript);
    }
  }, [voiceRec.isListening, voiceRec.interimTranscript]);

  // Send message function
  const sendMessage = useCallback(async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    // Stop speaking any previous message
    tts.stop();
    setSpeakingMessageId(null);

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await postAIChatMessage(
        [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }))
      );

      const aiResponseContent = data?.content || "I am analyzing your profile matches.";
      const aiMsgId = (Date.now() + 1).toString();

      const aiMessage = {
        id: aiMsgId,
        role: "assistant",
        content: aiResponseContent,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Automatically speak the response if voice readback is enabled
      if (!tts.isMuted) {
        setSpeakingMessageId(aiMsgId);
        tts.speak(aiResponseContent, () => {
          setSpeakingMessageId(null);
          // Continuous Siri/Alexa turn-taking: If hands-free is enabled, auto-listen for follow-up query!
          if (isHandsFree) {
            setTimeout(() => {
              if (!voiceRec.isListening) {
                handleMicClick();
              }
            }, 350);
          }
        });
      }
    } catch (err) {
      console.error("AI Assistant Error:", err);
      const cleanInput = textToSend.replace(/[^a-z0-9\s]/gi, " ").trim().toLowerCase();
      const isGreeting =
        /^(hey|hi|hello|greetings|good\s*(morning|afternoon|evening)|howdy|sup|yo|what\s*s\s*up)\b/i.test(cleanInput) ||
        cleanInput === "hey dhruv" ||
        cleanInput === "hi dhruv" ||
        cleanInput === "hello dhruv" ||
        cleanInput === "dhruv" ||
        cleanInput === "hey" ||
        cleanInput === "hi" ||
        cleanInput === "hello";
      const displayName = user?.name && user.name.toLowerCase() !== "user" ? user.name.split(" ")[0] : (user?.name || "there");

      const fallbackContent = isGreeting
        ? `Hey **${displayName}**! 😊 Great to see you. How are you doing today? How can I help you on your career journey?`
        : `Hi **${displayName}**! I'm DHRUV, your career coach. I'm right here to help you discover top jobs in **${user?.field || "Software Engineering"}**, analyze your skills, or practice for an interview!`;
      const fallbackId = Date.now().toString();

      setMessages((prev) => [
        ...prev,
        {
          id: fallbackId,
          role: "assistant",
          content: fallbackContent,
        },
      ]);

      if (!tts.isMuted) {
        setSpeakingMessageId(fallbackId);
        tts.speak(fallbackContent, () => {
          setSpeakingMessageId(null);
          if (isHandsFree) {
            setTimeout(() => {
              if (!voiceRec.isListening) {
                handleMicClick();
              }
            }, 350);
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, tts, user, isHandsFree, voiceRec.isListening]);

  // Handle Speech-to-Text Microphone toggle
  const handleMicClick = () => {
    if (!voiceRec.isSupported) {
      toast.error("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    if (voiceRec.isListening) {
      voiceRec.stopListening();
    } else {
      tts.stop();
      voiceRec.startListening({
        onResult: (finalText) => {
          if (finalText && finalText.trim()) {
            const cleanFinal = finalText.trim();
            setInput(cleanFinal);
            sendMessage(cleanFinal);
          }
        },
      });
    }
  };

  // Handle auto-start voice or initial query when opened via wake word
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      sendMessage(initialQuery.trim());
    } else if (isOpen && autoStartVoice && !voiceRec.isListening) {
      const timer = setTimeout(() => {
        handleMicClick();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery, autoStartVoice]);

  // Continuous wake word listening when DHRUV drawer is open and hands-free is enabled
  useEffect(() => {
    if (!isOpen || !isHandsFree || !voiceRec.isSupported || voiceRec.isListening) {
      voiceRec.stopWakeWord();
      return;
    }

    voiceRec.listenForWakeWord((promptAfterWake) => {
      toast("DHRUV detected wake word! Listening...", { icon: "⚡" });
      if (promptAfterWake && promptAfterWake.length > 2) {
        sendMessage(promptAfterWake);
      } else {
        handleMicClick();
      }
    });

    return () => {
      voiceRec.stopWakeWord();
    };
  }, [isOpen, isHandsFree, voiceRec.isSupported, voiceRec.isListening]);

  // Toggle Hands-Free Wake Word Mode ("Hey Dhruv")
  const toggleHandsFree = () => {
    if (!voiceRec.isSupported) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isHandsFree) {
      setIsHandsFree(false);
      try {
        localStorage.setItem("dhruv_wake_word_enabled", "false");
        window.dispatchEvent(new Event("dhruv_wake_word_toggled"));
      } catch (e) {
        console.warn(e);
      }
      voiceRec.stopWakeWord();
      toast("Hands-free mode disabled.", { icon: "🎙️" });
    } else {
      setIsHandsFree(true);
      try {
        localStorage.setItem("dhruv_wake_word_enabled", "true");
        window.dispatchEvent(new Event("dhruv_wake_word_toggled"));
      } catch (e) {
        console.warn(e);
      }
      toast.success("Hands-free active! Say 'Hey Dhruv' anytime to ask a question.");
    }
  };

  // Play/Stop individual message TTS
  const handleToggleSpeakMessage = (msgId, text) => {
    if (speakingMessageId === msgId && tts.isSpeaking) {
      tts.stop();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msgId);
      tts.speak(text);
    }
  };

  // Reset conversation
  const handleReset = () => {
    tts.stop();
    setSpeakingMessageId(null);
    voiceRec.stopListening();
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Conversation reset! I'm **DHRUV**. How can I help with your ${user?.field || "Software Engineering"} career goals today?`,
        isWelcome: true,
      },
    ]);
  };

  // Close widget & clean up voice
  const handleClose = () => {
    tts.stop();
    voiceRec.stopListening();
    setIsOpen(false);
  };

  return (
    <>
      {/* Dynamic Keyframes for Pulsing Glow Animation */}
      <style>{`
        @keyframes dhruvMicPulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes dhruvGlow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes dhruvWaveBar {
          0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
          50% { transform: scaleY(1.35); opacity: 1; }
        }
        @keyframes dhruvSiriPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(56, 189, 248, 0.35), inset 0 0 15px rgba(129, 140, 248, 0.25); }
          50% { box-shadow: 0 0 25px rgba(192, 132, 252, 0.55), inset 0 0 20px rgba(56, 189, 248, 0.45); }
        }
      `}</style>

      {/* Floating Trigger Button */}
      {!hideFloatingTrigger && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "16px",
            right: "24px",
            zIndex: 900,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "9999px",
            fontWeight: "700",
            fontSize: "0.92rem",
            border: "none",
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
            cursor: "pointer",
            transition: "transform 0.2s ease, background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HiSparkles size={20} />
          </div>
          <span>Ask DHRUV</span>
        </button>
      )}

      {/* Expandable Chat Drawer (Draggable & Movable) */}
      {isOpen && (
        <div
          ref={cardRef}
          style={{
            position: "fixed",
            left: position.x !== null ? `${position.x}px` : "auto",
            top: position.y !== null ? `${position.y}px` : "auto",
            bottom: position.y !== null ? "auto" : "16px",
            right: position.x !== null ? "auto" : "16px",
            zIndex: 9999,
            width: "390px",
            maxWidth: "calc(100vw - 32px)",
            height: "580px",
            maxHeight: "84vh",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #cbd5e1",
            boxShadow: isDragging
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(37, 99, 235, 0.35)"
              : "0 20px 40px rgba(0, 0, 0, 0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "Inter, system-ui, sans-serif",
            userSelect: isDragging ? "none" : "auto",
            transition: isDragging ? "none" : "box-shadow 0.2s ease",
          }}
        >
          {/* Header (Drag Handle) */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onDoubleClick={handleHeaderDoubleClick}
            title="Click & drag to move card • Double-click to reset position"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              backgroundColor: isDragging ? "#f1f5f9" : "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
          >
            {/* Drag Handle Bar Indicator */}
            <div
              style={{
                position: "absolute",
                top: "4px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "36px",
                height: "4px",
                borderRadius: "9999px",
                backgroundColor: isDragging ? "#3b82f6" : "#cbd5e1",
                transition: "background-color 0.15s ease",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "10px", pointerEvents: "none" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BsRobot size={20} />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#0f172a", lineHeight: 1.2, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>DHRUV</span>
                  <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "6px", backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: "700" }}>AI</span>
                </div>
                <div style={{ fontSize: "0.73rem", color: "#64748b" }}>Career Coach & Voice Assistant</div>
              </div>
            </div>

            {/* Header Audio & Voice Controls */}
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: "2px" }}
            >
              {/* Hands-Free Wake Word Toggle */}
              {voiceRec.isSupported && (
                <button
                  type="button"
                  onClick={toggleHandsFree}
                  aria-label={isHandsFree ? "Disable hands-free wake word" : "Enable hands-free wake word"}
                  title={isHandsFree ? "Hands-Free Mode: ON (Say 'Hey Dhruv')" : "Enable Hands-Free Wake Word ('Hey Dhruv')"}
                  style={{
                    background: isHandsFree ? "#ecfdf5" : "transparent",
                    border: isHandsFree ? "1px solid #a7f3d0" : "1px solid transparent",
                    padding: "6px 8px",
                    cursor: "pointer",
                    color: isHandsFree ? "#059669" : "#64748b",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.72rem",
                    fontWeight: "600",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Radio size={14} className={isHandsFree ? "animate-pulse text-emerald-600" : ""} />
                  <span style={{ fontSize: "0.68rem" }}>{isHandsFree ? "Wake ON" : "Wake"}</span>
                </button>
              )}

              {/* TTS Audio Readback Mute Toggle */}
              {tts.isSupported && (
                <button
                  type="button"
                  onClick={tts.toggleMute}
                  aria-label={tts.isMuted ? "Unmute audio readback" : "Mute audio readback"}
                  title={tts.isMuted ? "Audio Readback: MUTED (click to unmute)" : "Audio Readback: ENABLED (click to mute)"}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "6px",
                    cursor: "pointer",
                    color: tts.isMuted ? "#94a3b8" : "#2563eb",
                    borderRadius: "6px",
                    transition: "color 0.15s ease",
                  }}
                >
                  {tts.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              )}

              {/* Reset Conversation */}
              <button
                type="button"
                onClick={handleReset}
                aria-label="Reset conversation"
                title="Reset Conversation"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#64748b",
                  borderRadius: "6px",
                }}
              >
                <HiArrowPath size={16} />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close DHRUV assistant"
                title="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#64748b",
                  borderRadius: "6px",
                }}
              >
                <HiXMark size={20} />
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: m.role === "user" ? "#f1f5f9" : "#2563eb",
                    color: m.role === "user" ? "#0f172a" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    flexShrink: 0,
                  }}
                >
                  {m.role === "user" ? <BsPerson size={14} /> : <BsRobot size={14} />}
                </div>
                <div
                  style={{
                    position: "relative",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    backgroundColor: m.role === "user" ? "#2563eb" : "#f1f5f9",
                    color: m.role === "user" ? "#ffffff" : "#1e293b",
                    borderTopRightRadius: m.role === "user" ? "4px" : "16px",
                    borderTopLeftRadius: m.role === "user" ? "16px" : "4px",
                  }}
                >
                  {renderFormattedContent(m.content)}

                  {/* Audio Listen / Pause Button for Assistant Messages */}
                  {m.role === "assistant" && !m.isWelcome && tts.isSupported && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSpeakMessage(m.id, m.content)}
                        title={speakingMessageId === m.id && tts.isSpeaking ? "Pause audio" : "Listen to answer"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          color: speakingMessageId === m.id && tts.isSpeaking ? "#2563eb" : "#64748b",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {speakingMessageId === m.id && tts.isSpeaking ? (
                          <>
                            <Square size={10} className="fill-blue-600 text-blue-600" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={11} />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Suggestion Chips on Welcome message */}
                  {m.isWelcome && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                      {SUGGESTION_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => sendMessage(chip)}
                          disabled={isLoading}
                          style={{
                            textAlign: "left",
                            fontSize: "0.8rem",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#2563eb",
                            fontWeight: "600",
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          • {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontSize: "0.8rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BsRobot size={14} />
                </div>
                <div style={{ padding: "8px 12px", background: "#f1f5f9", borderRadius: "12px", fontStyle: "italic" }}>
                  DHRUV is analyzing your career profile...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Active Voice Listening Banner (Siri / Alexa Voice Wave) */}
          {voiceRec.isListening && (
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                borderTop: "1px solid rgba(59, 130, 246, 0.4)",
                padding: "9px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                color: "#ffffff",
                boxShadow: "0 -4px 14px rgba(37, 99, 235, 0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                {/* Siri / Alexa animated frequency bars */}
                <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "18px" }}>
                  <span style={{ width: "3px", height: "14px", backgroundColor: "#38bdf8", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out" }} />
                  <span style={{ width: "3px", height: "20px", backgroundColor: "#818cf8", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out 0.15s" }} />
                  <span style={{ width: "3px", height: "12px", backgroundColor: "#c084fc", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out 0.3s" }} />
                  <span style={{ width: "3px", height: "16px", backgroundColor: "#34d399", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out 0.2s" }} />
                </div>
                <span style={{ fontWeight: "700", color: "#38bdf8", fontSize: "0.78rem", letterSpacing: "0.2px" }}>Listening...</span>
                <span style={{ color: "#e2e8f0", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px", fontSize: "0.78rem" }}>
                  {voiceRec.interimTranscript ? `"${voiceRec.interimTranscript}"` : "Speak any query naturally"}
                </span>
              </div>
              <button
                type="button"
                onClick={voiceRec.stopListening}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  padding: "4px 9px",
                  borderRadius: "6px",
                  transition: "background 0.15s ease",
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Input Bar with Voice & Send Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={voiceRec.isListening ? "Listening to your voice..." : "Ask about your job matches or say 'Hey Dhruv'..."}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.88rem",
                color: "#0f172a",
                backgroundColor: "transparent",
              }}
            />

            {/* Microphone Button (Speech-to-Text) */}
            {voiceRec.isSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                aria-label={voiceRec.isListening ? "Stop voice listening" : "Start voice speech recognition"}
                title={voiceRec.isListening ? "Listening... Click to stop" : "Speak to DHRUV (Voice Command)"}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: voiceRec.isListening ? "#ef4444" : "#f1f5f9",
                  color: voiceRec.isListening ? "#ffffff" : "#475569",
                  border: voiceRec.isListening ? "2px solid #dc2626" : "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  animation: voiceRec.isListening ? "dhruvMicPulse 1.5s infinite" : "none",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                {voiceRec.isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}

            {/* Send Message Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message to DHRUV"
              title="Send Message"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() ? "pointer" : "default",
                opacity: input.trim() && !isLoading ? 1 : 0.4,
                flexShrink: 0,
              }}
            >
              <HiPaperAirplane size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
