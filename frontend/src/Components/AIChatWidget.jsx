import React, { useState, useRef, useEffect } from "react";
import { HiSparkles, HiXMark, HiPaperAirplane, HiArrowPath } from "react-icons/hi2";
import { BsRobot, BsPerson } from "react-icons/bs";
import { postAIChatMessage } from "../Services/jobService";

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

export default function AIChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi ${user?.name || "there"}! I'm **DHRUV**, your SkillBridge AI Career Coach.\n\nHere are some options to get started:`,
      isWelcome: true,
    },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

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

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.content || "I am analyzing your profile matches.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI Assistant Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Hi ${user?.name || "Candidate"}! I'm DHRUV. Based on your target domain (**${user?.field || "Software Engineering"}**), focus on applying to openings matching your core skills (${user?.skills?.slice(0, 3).join(", ") || "React"}).`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Conversation reset! I'm **DHRUV**. How can I help with your ${user?.field || "Software Engineering"} career goals today?`,
        isWelcome: true,
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
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

      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 10000,
            width: "380px",
            maxWidth: "92vw",
            height: "560px",
            maxHeight: "80vh",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #cbd5e1",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#0f172a", lineHeight: 1.2 }}>
                  DHRUV
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>AI Career Coach & Skill Analyst</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                type="button"
                onClick={handleReset}
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
              <button
                type="button"
                onClick={() => setIsOpen(false)}
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
                  Analyzing your domain & skills...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 14px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your job matches..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.88rem",
                color: "#0f172a",
                backgroundColor: "transparent",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() ? "pointer" : "default",
                opacity: input.trim() && !isLoading ? 1 : 0.4,
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
