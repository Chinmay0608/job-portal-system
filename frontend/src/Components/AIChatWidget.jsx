import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { HiSparkles } from "react-icons/hi2";
import { BsPerson } from "react-icons/bs";
import { 
  RotateCcw,
  Volume2, 
  VolumeX, 
  X,
  Menu,
  HelpCircle,
  Search,
  FileText,
  Bell,
  Send,
  Mic, 
  MicOff, 
  Radio, 
  Square,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { postAIChatMessage, postAIFeedback, getJobs } from "../Services/jobService";
import { uploadResume } from "../Services/userService";
import useVoiceRecognition from "../hooks/useVoiceRecognition";
import useTextToSpeech from "../hooks/useTextToSpeech";
import dhruvAvatar from "../assets/dhruv_avatar.png";

const createUniqueMsgId = (prefix = "msg") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const SUGGESTION_CHIPS = [
  "How can I prepare for an interview?",
  "Recommend top jobs for my field",
  "Analyze my skill gaps",
];

const FAQ_QUESTIONS = [
  "How can I prepare for technical interviews?",
  "What are the top skills recruiters look for?",
  "How does SkillBridge AI match my profile?",
  "How do I apply for jobs on SkillBridge?",
];

const GUIDED_ROLES = [
  "Frontend Developer",
  "Full Stack Engineer",
  "Backend Node.js / Python",
  "Data Scientist / AI Engineer",
  "DevOps / Cloud Engineer",
  "UI/UX Designer",
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
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const fileInputRef = useRef(null);
  const quickMenuRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const cardRef = useRef(null);

  const [isHandsFree, setIsHandsFree] = useState(() => {
    try {
      return localStorage.getItem("dhruv_wake_word_enabled") !== "false";
    } catch {
      return true;
    }
  });
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState({});

  const voiceRec = useVoiceRecognition();
  const tts = useTextToSpeech();

  // Close quick menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        quickMenuRef.current && 
        !quickMenuRef.current.contains(e.target) &&
        !e.target.closest(".dhruv-menu-btn")
      ) {
        setShowQuickMenu(false);
      }
    };
    if (showQuickMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showQuickMenu]);

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

  const handleDragStart = (e) => {
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
      content: `Hi ${user?.name || "there"}! I'm **Dhruv**, your AI Career Guide.\n\nHow can I help you accelerate your career today?`,
      isWelcome: true,
      suggestions: SUGGESTION_CHIPS,
    },
  ]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Update input text with interim speech while candidate is talking
  useEffect(() => {
    if (voiceRec.isListening && voiceRec.interimTranscript) {
      setInput(voiceRec.interimTranscript);
    }
  }, [voiceRec.isListening, voiceRec.interimTranscript]);

  // Send message function (declared before handleMicClick to prevent hoist warnings)
  const sendMessage = useCallback(async (queryText) => {
    const textToSend = queryText !== undefined ? queryText : input;
    if (!textToSend.trim() || isLoading) return;

    tts.stop();
    setSpeakingMessageId(null);
    setShowQuickMenu(false);

    const userMessage = {
      id: createUniqueMsgId("user"),
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

      const aiResponseContent = data?.content || "I am analyzing your career matches.";
      const aiMsgId = createUniqueMsgId("ai");

      const aiMessage = {
        id: aiMsgId,
        role: "assistant",
        content: aiResponseContent,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (!tts.isMuted) {
        setSpeakingMessageId(aiMsgId);
        tts.speak(aiResponseContent, () => {
          setSpeakingMessageId(null);
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
        ? `Hey **${displayName}**! 😊 Great to see you. How can I help you on your career journey today?`
        : `Hi **${displayName}**! I'm Dhruv, your career guide. I'm right here to help you discover top jobs in **${user?.field || "Software Engineering"}**, analyze your skills, or prepare for an interview!`;
      const fallbackId = createUniqueMsgId("ai_fb");

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
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, tts, user]);

  // Handle Speech-to-Text Microphone toggle
  const handleMicClick = useCallback(() => {
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
  }, [voiceRec, tts, sendMessage]);

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
  }, [isOpen, initialQuery, autoStartVoice, handleMicClick, sendMessage, voiceRec.isListening]);

  // Continuous wake word listening when DHRUV drawer is open and hands-free is enabled
  useEffect(() => {
    if (!isOpen || !isHandsFree || !voiceRec.isSupported || voiceRec.isListening) {
      voiceRec.stopWakeWord();
      return;
    }

    voiceRec.listenForWakeWord((promptAfterWake) => {
      toast("Dhruv detected wake word! Listening...", { icon: "⚡" });
      if (promptAfterWake && promptAfterWake.length > 2) {
        sendMessage(promptAfterWake);
      } else {
        handleMicClick();
      }
    });

    return () => {
      voiceRec.stopWakeWord();
    };
  }, [isOpen, isHandsFree, voiceRec, handleMicClick, sendMessage]);

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
    setShowQuickMenu(false);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Conversation restarted! I'm **Dhruv**, your AI Career Guide.\n\nHow can I help with your ${user?.field || "Software Engineering"} career goals today?`,
        isWelcome: true,
        suggestions: SUGGESTION_CHIPS,
      },
    ]);
    toast.success("Chat restarted", { icon: "🔄" });
  };

  // Quick Action Menu Handlers
  const handleAskQuestion = () => {
    setShowQuickMenu(false);
    setMessages((prev) => [
      ...prev,
      {
        id: createUniqueMsgId("ask"),
        role: "assistant",
        content: `💡 **Ask Anything**\n\nI'm ready to answer any career or platform questions! You can type below or pick one of these popular questions:`,
        suggestions: FAQ_QUESTIONS,
      },
    ]);
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleGuidedJobSearch = () => {
    setShowQuickMenu(false);
    setMessages((prev) => [
      ...prev,
      {
        id: createUniqueMsgId("guided"),
        role: "assistant",
        content: `🔍 **Guided Job Search**\n\nI'll help you find live openings matched to your profile. Select your target specialization or type your custom role:`,
        roleOptions: GUIDED_ROLES,
      },
    ]);
  };

  const handleSelectGuidedRole = async (roleName) => {
    const userMsg = {
      id: createUniqueMsgId("role_select"),
      role: "user",
      content: `Show me ${roleName} openings`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await getJobs({ search: roleName, limit: 3 });
      const jobs = res?.jobs || res?.data || [];

      if (jobs.length > 0) {
        const jobListings = jobs.slice(0, 3).map((j, i) => 
          `${i + 1}. **${j.title}** at **${j.company || "Leading Company"}**\n   📍 ${j.location || "Remote"} • 💼 ${j.type || "Full-time"}\n   🔗 [View & Apply on SkillBridge](/candidate/dashboard?search=${encodeURIComponent(j.title)})`
        ).join("\n\n");

        const replyContent = `🎯 Found top live positions for **${roleName}**:\n\n${jobListings}\n\nWould you like me to analyze interview questions for these roles or explore other skills?`;

        setMessages((prev) => [
          ...prev,
          {
            id: createUniqueMsgId("jobs_result"),
            role: "assistant",
            content: replyContent,
            suggestions: [
              `Interview tips for ${roleName}`,
              `Required skills for ${roleName}`,
              "Recommend more jobs"
            ]
          }
        ]);
      } else {
        sendMessage(`Find top hiring trends and career roadmap for ${roleName}`);
      }
    } catch (err) {
      console.error("Guided search error:", err);
      sendMessage(`What are the top job opportunities and requirements for ${roleName}?`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerUploadResume = () => {
    setShowQuickMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const userMsg = {
      id: createUniqueMsgId("resume_upload"),
      role: "user",
      content: `Uploaded Resume: **${file.name}**`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await uploadResume(file);
      const parsedInfo = result?.user || result?.data || {};
      const skills = parsedInfo.skills || [];
      const field = parsedInfo.field || user?.field || "Technology";

      const skillsSnippet = skills.length > 0 ? `\n• **Skills Detected**: ${skills.slice(0, 8).join(", ")}` : "";
      const content = `🎉 **Resume Analyzed Successfully!**\n\n• **File**: ${file.name}\n• **Target Field**: ${field}${skillsSnippet}\n• **Profile Status**: Updated with AI parsing\n\nWould you like me to match live jobs for these skills or audit your profile?`;

      setMessages((prev) => [
        ...prev,
        {
          id: createUniqueMsgId("resume_parsed"),
          role: "assistant",
          content,
          suggestions: [
            "Recommend top jobs for my resume",
            "Analyze my skill gaps",
            "Interview questions for my profile"
          ]
        }
      ]);
      toast.success("Resume parsed and synced successfully!", { icon: "📄" });
    } catch (err) {
      console.error("Resume upload error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: createUniqueMsgId("resume_err"),
          role: "assistant",
          content: `⚠️ I had trouble extracting the resume text. You can still ask me any career question or share your key skills directly here!`,
        }
      ]);
      toast.error("Failed to upload resume. Please try a valid PDF or Word document.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetJobAlerts = () => {
    setShowQuickMenu(false);
    const candidateField = user?.field || "Software Development";
    const candidateEmail = user?.email || "your registered email";
    const content = `🔔 **AI Job Digest Alerts**\n\nSkillBridge automatically runs candidate matching and delivers a curated weekly job digest every **Monday at 9:00 AM** to:\n📧 **${candidateEmail}**\n\n• **Current Alert Filter**: **${candidateField}**\n• **Status**: Active ✅\n\nWould you like to browse current matches or explore new openings in your domain?`;

    setMessages((prev) => [
      ...prev,
      {
        id: createUniqueMsgId("alerts"),
        role: "assistant",
        content,
        suggestions: [
          `Browse ${candidateField} jobs now`,
          "How to optimize my alerts",
          "Analyze skill gaps"
        ]
      }
    ]);
  };

  // Submit thumbs-up / thumbs-down feedback for an assistant message
  const handleFeedback = useCallback(async (msg, rating) => {
    const msgIndex = messages.findIndex((m) => m.id === msg.id);
    const precedingUser = msgIndex > 0 ? messages.slice(0, msgIndex).reverse().find((m) => m.role === "user") : null;
    const prompt = precedingUser?.content || "Candidate query";

    setMessageFeedback((prev) => ({ ...prev, [msg.id]: rating }));

    try {
      await postAIFeedback({ prompt, response: msg.content, rating });
      toast.success(rating === "positive" ? "Feedback submitted!" : "Thanks for your feedback", { duration: 1500 });
    } catch {
      setMessageFeedback((prev) => ({ ...prev, [msg.id]: null }));
    }
  }, [messages]);

  // Close widget & clean up voice
  const handleClose = () => {
    tts.stop();
    voiceRec.stopListening();
    setShowQuickMenu(false);
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
        @keyframes dhruvWaveBar {
          0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
          50% { transform: scaleY(1.35); opacity: 1; }
        }
        @keyframes dhruvTypingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* Hidden File Input for Resume Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleResumeFileChange}
        accept=".pdf,.doc,.docx"
        style={{ display: "none" }}
      />

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
          <span>Ask Dhruv</span>
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
            height: "600px",
            maxHeight: "86vh",
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
          {/* Header (Drag Handle & Controls Matching Screenshot) */}
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
              padding: "12px 16px",
              backgroundColor: isDragging ? "#f1f5f9" : "#ffffff",
              borderBottom: "1px solid #f1f5f9",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
          >
            {/* Left: Chatbot Icon / Logo & Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", pointerEvents: "none" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                <img
                  src={dhruvAvatar}
                  alt="Dhruv"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "#1e293b", letterSpacing: "-0.2px", lineHeight: 1.2 }}>
                  Dhruv Career Guide
                </div>
              </div>
            </div>

            {/* Right: Header Action Controls (Restart, TTS, Close) */}
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
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
                    padding: "6px",
                    cursor: "pointer",
                    color: isHandsFree ? "#059669" : "#64748b",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Radio size={16} className={isHandsFree ? "animate-pulse text-emerald-600" : ""} />
                </button>
              )}

              {/* Reset / Restart Chat */}
              <button
                type="button"
                onClick={handleReset}
                aria-label="Restart chat"
                title="Restart chat"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#475569",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#475569";
                }}
              >
                <RotateCcw size={18} />
              </button>

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
                    color: tts.isMuted ? "#94a3b8" : "#475569",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {tts.isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close Dhruv Assistant"
                title="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#475569",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fee2e2";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#475569";
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Privacy Statement Notice Banner (Matching Screenshot) */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              padding: "10px 16px",
              fontSize: "0.78rem",
              lineHeight: "1.4",
              color: "#64748b",
              position: "relative",
            }}
          >
            <span>
              If you would like further information about how SkillBridge uses the details you provide to us, please see our Recruitment{" "}
              <Link
                to="/privacy-policy"
                style={{
                  color: "#0369a1",
                  fontWeight: "600",
                  textDecoration: "underline",
                }}
                onClick={() => setIsOpen(false)}
              >
                Privacy Statement.
              </Link>
            </span>
          </div>

          {/* Messages Thread */}
          <div style={{ flex: 1, padding: "14px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#f8fafc" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                }}
              >
                {/* Avatar Icon */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: m.role === "user" ? "#f1f5f9" : "#0284c7",
                    color: m.role === "user" ? "#0f172a" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    flexShrink: 0,
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {m.role === "user" ? (
                    <BsPerson size={14} />
                  ) : (
                    <img
                      src={dhruvAvatar}
                      alt="Dhruv"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    position: "relative",
                    padding: "10px 14px",
                    borderRadius: "18px",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    backgroundColor: m.role === "user" ? "#0284c7" : "#ffffff",
                    color: m.role === "user" ? "#ffffff" : "#1e293b",
                    borderTopRightRadius: m.role === "user" ? "4px" : "18px",
                    borderTopLeftRadius: m.role === "user" ? "18px" : "4px",
                    boxShadow: m.role === "user" ? "none" : "0 1px 3px rgba(0,0,0,0.05)",
                    border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                  }}
                >
                  {renderFormattedContent(m.content)}

                  {/* Audio & Feedback Toolbar for Assistant Messages */}
                  {m.role === "assistant" && !m.isWelcome && tts.isSupported && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", gap: "6px", borderTop: "1px solid #f1f5f9", paddingTop: "6px" }}>
                      {/* Listen / Stop */}
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
                          color: speakingMessageId === m.id && tts.isSpeaking ? "#0284c7" : "#64748b",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {speakingMessageId === m.id && tts.isSpeaking ? (
                          <>
                            <Square size={10} className="fill-sky-600 text-sky-600" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={11} />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      {/* Thumbs Feedback */}
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[
                          { rating: "positive", Icon: ThumbsUp,   activeColor: "#16a34a", label: "Helpful"     },
                          { rating: "negative", Icon: ThumbsDown, activeColor: "#dc2626", label: "Not helpful" },
                        ].map(({ rating, Icon, activeColor, label }) => {
                          const current = messageFeedback[m.id];
                          const isSelected = current === rating;
                          const isDisabled = !!current;
                          return (
                            <button
                              key={rating}
                              type="button"
                              title={label}
                              disabled={isDisabled}
                              onClick={() => !isDisabled && handleFeedback(m, rating)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                border: `1px solid ${isSelected ? activeColor : "#e2e8f0"}`,
                                background: isSelected ? `${activeColor}18` : "#ffffff",
                                color: isSelected ? activeColor : "#94a3b8",
                                cursor: isDisabled ? "default" : "pointer",
                                transition: "all 0.15s ease",
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={11} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Guided Role Options Buttons */}
                  {m.roleOptions && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                      {m.roleOptions.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleSelectGuidedRole(role)}
                          disabled={isLoading}
                          style={{
                            textAlign: "left",
                            fontSize: "0.8rem",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            border: "1px solid #bfdbfe",
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease, transform 0.1s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#dbeafe";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#eff6ff";
                          }}
                        >
                          <span>{role}</span>
                          <ArrowRight size={13} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Interactive Suggestion Chips */}
                  {m.suggestions && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                      {m.suggestions.map((chip) => (
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
                            color: "#0369a1",
                            fontWeight: "600",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f0f9ff";
                            e.currentTarget.style.borderColor = "#7dd3fc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                            e.currentTarget.style.borderColor = "#cbd5e1";
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
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignSelf: "flex-start",
                  maxWidth: "88%",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={dhruvAvatar}
                    alt="Dhruv"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "#ffffff",
                    borderRadius: "18px",
                    borderTopLeftRadius: "4px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    height: "36px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: "#0284c7",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "dhruvTypingDot 1.4s infinite ease-in-out",
                    }}
                  />
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: "#0284c7",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "dhruvTypingDot 1.4s infinite ease-in-out 0.2s",
                    }}
                  />
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      backgroundColor: "#0284c7",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "dhruvTypingDot 1.4s infinite ease-in-out 0.4s",
                    }}
                  />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Active Voice Listening Banner */}
          {voiceRec.isListening && (
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #0369a1 100%)",
                borderTop: "1px solid rgba(56, 189, 248, 0.4)",
                padding: "9px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.8rem",
                color: "#ffffff",
                boxShadow: "0 -4px 14px rgba(2, 132, 199, 0.25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "18px" }}>
                  <span style={{ width: "3px", height: "14px", backgroundColor: "#38bdf8", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out" }} />
                  <span style={{ width: "3px", height: "20px", backgroundColor: "#bae6fd", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out 0.15s" }} />
                  <span style={{ width: "3px", height: "12px", backgroundColor: "#7dd3fc", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out 0.3s" }} />
                  <span style={{ width: "3px", height: "16px", backgroundColor: "#34d399", borderRadius: "2px", animation: "dhruvWaveBar 0.75s infinite ease-in-out 0.2s" }} />
                </div>
                <span style={{ fontWeight: "700", color: "#38bdf8", fontSize: "0.78rem" }}>Listening...</span>
                <span style={{ color: "#e2e8f0", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px", fontSize: "0.78rem" }}>
                  {voiceRec.interimTranscript ? `"${voiceRec.interimTranscript}"` : "Speak any question..."}
                </span>
              </div>
              <button
                type="button"
                onClick={voiceRec.stopListening}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  padding: "4px 9px",
                  borderRadius: "6px",
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Quick Action Popover Menu (Matching Screenshot Floating ☰ Popover) */}
          {showQuickMenu && (
            <div
              ref={quickMenuRef}
              style={{
                position: "absolute",
                bottom: "74px",
                left: "14px",
                width: "230px",
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)",
                zIndex: 10001,
                padding: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                animation: "fadeIn 0.15s ease-out",
              }}
            >
              {/* Option 1: Ask a question */}
              <button
                type="button"
                onClick={handleAskQuestion}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#1e293b",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <HelpCircle size={17} color="#475569" />
                <span>Ask a question</span>
              </button>

              {/* Option 2: Guided Job Search */}
              <button
                type="button"
                onClick={handleGuidedJobSearch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#1e293b",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Search size={17} color="#475569" />
                <span>Guided Job Search</span>
              </button>

              {/* Option 3: Upload Resume */}
              <button
                type="button"
                onClick={handleTriggerUploadResume}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#1e293b",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <FileText size={17} color="#475569" />
                <span>Upload Resume</span>
              </button>

              {/* Option 4: Set Job Alerts */}
              <button
                type="button"
                onClick={handleSetJobAlerts}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "#1e293b",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 0.12s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Bell size={17} color="#475569" />
                <span>Set Job Alerts</span>
              </button>
            </div>
          )}

          {/* Footer Input Bar Container (Pill Shaped Matching Screenshot) */}
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px 6px 12px",
                backgroundColor: "#ffffff",
                border: "1.5px solid #cbd5e1",
                borderRadius: "9999px",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0284c7")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
            >
              {/* Left: ☰ Hamburger Action Menu Button */}
              <button
                type="button"
                className="dhruv-menu-btn"
                onClick={() => setShowQuickMenu((prev) => !prev)}
                aria-label="Quick Actions Menu"
                title="Quick Actions Menu"
                style={{
                  background: showQuickMenu ? "#e0f2fe" : "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#0284c7",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                <Menu size={20} />
              </button>

              {/* Text Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={voiceRec.isListening ? "Listening to your voice..." : "Ask anything"}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "0.9rem",
                  color: "#0f172a",
                  backgroundColor: "transparent",
                  fontFamily: "inherit",
                }}
              />

              {/* Voice Mic Button */}
              {voiceRec.isSupported && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoading}
                  aria-label={voiceRec.isListening ? "Stop voice listening" : "Start voice speech recognition"}
                  title={voiceRec.isListening ? "Listening... Click to stop" : "Speak to Dhruv"}
                  style={{
                    background: voiceRec.isListening ? "#ef4444" : "transparent",
                    color: voiceRec.isListening ? "#ffffff" : "#64748b",
                    border: "none",
                    padding: "6px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    animation: voiceRec.isListening ? "dhruvMicPulse 1.5s infinite" : "none",
                    flexShrink: 0,
                  }}
                >
                  {voiceRec.isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}

              {/* Send Button (Paper Airplane) */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                title="Send"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() ? "pointer" : "default",
                  color: input.trim() ? "#0284c7" : "#94a3b8",
                  opacity: input.trim() && !isLoading ? 1 : 0.45,
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
