import { useState, useEffect, useRef } from "react";
import { 
  FiSearch, 
  FiX, 
  FiSend, 
  FiArrowLeft, 
  FiArchive, 
  FiBriefcase 
} from "react-icons/fi";
import { BsChatSquareTextFill, BsCheck2All } from "react-icons/bs";
import { STORAGE_KEY_PREFIX } from "../Services/messageService";
import "../Styles/components/MessagesDrawer.css";

const generateMsgId = () => "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);

const INITIAL_CONVERSATIONS_CANDIDATE = [
  {
    id: "conv-1",
    name: "Sarah Jenkins",
    role: "Lead Technical Recruiter",
    company: "Google Cloud",
    color: "#4285F4",
    initials: "SJ",
    jobTitle: "Senior Frontend / React Engineer",
    unread: true,
    archived: false,
    lastTime: "10:32 AM",
    messages: [
      {
        id: "m-1",
        sender: "recruiter",
        text: "Hi there! I reviewed your SkillBridge profile and was very impressed with your frontend expertise. We have an active opening on our Core Cloud Tools team.",
        time: "10:30 AM"
      },
      {
        id: "m-2",
        sender: "recruiter",
        text: "Would you be open to an introductory 20-minute discussion this Thursday or Friday to chat about the role and team roadmap?",
        time: "10:32 AM"
      }
    ],
    quickReplies: [
      "I'm very interested! Thursday afternoon works great.",
      "Friday morning works best for me. Let's schedule it!",
      "Could you share more details about the team's tech stack?"
    ]
  },
  {
    id: "conv-2",
    name: "Marcus Vance",
    role: "Head of Engineering Talent",
    company: "Stripe",
    color: "#635BFF",
    initials: "MV",
    jobTitle: "Full Stack Platform Developer",
    unread: true,
    archived: false,
    lastTime: "Yesterday",
    messages: [
      {
        id: "m-3",
        sender: "recruiter",
        text: "Hello! Thank you for applying to Stripe via SkillBridge. Our hiring committee looked over your background and we would like to proceed with your candidacy.",
        time: "Yesterday, 3:15 PM"
      },
      {
        id: "m-4",
        sender: "recruiter",
        text: "Please let us know your general availability next week for our initial technical walkthrough.",
        time: "Yesterday, 3:16 PM"
      }
    ],
    quickReplies: [
      "Thank you Marcus! I am free anytime Monday or Tuesday afternoon.",
      "Excited to move forward! Please send over the calendar invite.",
      "I am available any weekday between 2 PM and 5 PM."
    ]
  },
  {
    id: "conv-3",
    name: "SkillBridge Concierge",
    role: "Career Support Operations",
    company: "SkillBridge",
    color: "#2563EB",
    initials: "SB",
    jobTitle: "Direct Employer Messaging System",
    unread: false,
    archived: false,
    lastTime: "2d ago",
    messages: [
      {
        id: "m-5",
        sender: "recruiter",
        text: "Welcome to SkillBridge Messages! When employers review your resume or invite you to an interview, their direct messages will appear right here.",
        time: "2 days ago"
      },
      {
        id: "m-6",
        sender: "recruiter",
        text: "You can chat in real-time, coordinate interview times, and ask recruiters questions about application expectations. Best of luck with your search!",
        time: "2 days ago"
      }
    ],
    quickReplies: [
      "Thanks! Excited to connect with companies.",
      "How do I update my notification preferences?",
      "Can recruiters see my full resume here?"
    ]
  }
];

const INITIAL_CONVERSATIONS_RECRUITER = [
  {
    id: "conv-r1",
    name: "Arjun Mehta",
    role: "Candidate",
    company: "Applicant for Full Stack Engineer",
    color: "#059669",
    initials: "AM",
    jobTitle: "Full Stack Engineer (React / Node.js)",
    unread: true,
    archived: false,
    lastTime: "11:15 AM",
    messages: [
      {
        id: "mr-1",
        sender: "recruiter",
        text: "Hello! Thank you for considering my application for the Full Stack Engineer role. I noticed you were looking for experience with distributed systems and MERN architecture.",
        time: "11:12 AM"
      },
      {
        id: "mr-2",
        sender: "recruiter",
        text: "I have uploaded my latest portfolio with my recent production microservices project. Please let me know if you need any additional code samples!",
        time: "11:15 AM"
      }
    ],
    quickReplies: [
      "Thanks Arjun! I am reviewing your code samples now.",
      "Great portfolio! Are you free for a call this week?",
      "Thank you for reaching out. We will follow up shortly."
    ]
  }
];

export default function MessagesDrawer({ isOpen, onClose, user }) {
  const userKey = STORAGE_KEY_PREFIX + (user?._id || user?.email || "guest");
  
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load messages from localStorage:", e);
    }
    return user?.role === "recruiter" 
      ? INITIAL_CONVERSATIONS_RECRUITER 
      : INITIAL_CONVERSATIONS_CANDIDATE;
  });

  const [activeId, setActiveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'unread' | 'archived'
  const [replyInput, setReplyInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(userKey, JSON.stringify(conversations));
      // Dispatch storage event so navbar badge updates immediately
      window.dispatchEvent(new Event("skillbridge_messages_updated"));
    } catch (e) {
      console.error("Failed to save messages:", e);
    }
  }, [conversations, userKey]);

  // Close drawer and reset active thread
  const handleClose = () => {
    setActiveId(null);
    onClose();
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeId, conversations, isTyping]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setActiveId(null);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeConv = conversations.find((c) => c.id === activeId);

  // Select conversation & mark as read
  const handleSelectConversation = (convId) => {
    setActiveId(convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread: false } : c))
    );
  };

  // Toggle archive
  const handleToggleArchive = (convId, e) => {
    e?.stopPropagation();
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, archived: !c.archived } : c))
    );
  };

  // Send a message
  const handleSendMessage = (textToSend) => {
    const content = (textToSend || replyInput).trim();
    if (!content || !activeId) return;

    const newMsg = {
      id: generateMsgId(),
      sender: "user",
      text: content,
      time: "Just now"
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            lastTime: "Just now",
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );

    setReplyInput("");

    // Simulate realistic recruiter acknowledgment
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const recruiterReplies = [
        `Thanks for the prompt response, ${user?.name ? user.name.split(" ")[0] : "there"}! I've noted this down and sent the details over to our interview coordinator.`,
        "Appreciate your message! We'll review your availability and confirm the meeting invite shortly.",
        "Got it! Thanks for getting back to me so quickly. Looking forward to our discussion."
      ];
      const randomReply = recruiterReplies[Math.floor(Math.random() * recruiterReplies.length)];
      
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              lastTime: "Just now",
              messages: [
                ...c.messages,
                {
                  id: generateMsgId(),
                  sender: "recruiter",
                  text: randomReply,
                  time: "Just now"
                }
              ]
            };
          }
          return c;
        })
      );
    }, 1400);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (filter === "unread" && !c.unread) return false;
    if (filter === "archived" && !c.archived) return false;
    if (filter === "all" && c.archived) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCompany = c.company.toLowerCase().includes(q);
      const matchJob = c.jobTitle.toLowerCase().includes(q);
      const matchMsg = c.messages.some((m) => m.text.toLowerCase().includes(q));
      return matchName || matchCompany || matchJob || matchMsg;
    }
    return true;
  });

  const unreadTotal = conversations.filter((c) => c.unread && !c.archived).length;

  if (!isOpen) return null;

  return (
    <div className="messages-drawer-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div 
        className="messages-drawer-panel" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="messages-panel-header">
          <div className="messages-header-left">
            <div className="messages-title-wrap">
              <BsChatSquareTextFill size={20} color="#2563eb" />
              <h2 className="messages-main-title">Messages</h2>
              {unreadTotal > 0 && (
                <span className="messages-badge">{unreadTotal} Unread</span>
              )}
            </div>
          </div>
          <button 
            type="button" 
            className="messages-close-btn" 
            onClick={handleClose} 
            aria-label="Close messages"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* View Mode: Active Thread vs Conversation List */}
        {activeConv ? (
          /* =======================================================
             ACTIVE CONVERSATION CHAT THREAD VIEW
             ======================================================= */
          <div className="chat-thread-view">
            <div className="chat-thread-header">
              <div className="chat-thread-header-left">
                <button 
                  type="button" 
                  className="chat-back-btn" 
                  onClick={() => setActiveId(null)}
                  title="Back to conversations"
                >
                  <FiArrowLeft size={18} />
                </button>
                <div 
                  className="conversation-avatar" 
                  style={{ backgroundColor: activeConv.color, width: 36, height: 36, fontSize: "0.85rem" }}
                >
                  {activeConv.initials}
                </div>
                <div className="chat-header-info">
                  <div className="chat-header-name">{activeConv.name}</div>
                  <div className="chat-header-sub">
                    <span className="chat-company-tag">{activeConv.company}</span>
                    <span>•</span>
                    <span>{activeConv.role}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="chat-back-btn"
                onClick={(e) => handleToggleArchive(activeConv.id, e)}
                title={activeConv.archived ? "Unarchive conversation" : "Archive conversation"}
              >
                <FiArchive size={16} color={activeConv.archived ? "#2563eb" : "#64748b"} />
              </button>
            </div>

            {/* Target Job Reference Pill */}
            {activeConv.jobTitle && (
              <div className="chat-job-pill">
                <FiBriefcase size={14} />
                <span>Regarding: {activeConv.jobTitle}</span>
              </div>
            )}

            {/* Thread Messages */}
            <div className="chat-thread-messages">
              <div className="chat-date-divider">
                <span>Recent Conversation</span>
              </div>

              {activeConv.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`chat-msg-row ${msg.sender === "user" ? "user" : "recruiter"}`}
                >
                  {msg.sender === "recruiter" && (
                    <div 
                      className="chat-msg-avatar" 
                      style={{ backgroundColor: activeConv.color }}
                    >
                      {activeConv.initials}
                    </div>
                  )}

                  <div className="chat-bubble-content">
                    <div className="chat-bubble">
                      {msg.text}
                    </div>
                    <div className="chat-bubble-meta">
                      <span>{msg.time}</span>
                      {msg.sender === "user" && (
                        <BsCheck2All className="chat-read-receipt" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="chat-msg-row recruiter">
                  <div 
                    className="chat-msg-avatar" 
                    style={{ backgroundColor: activeConv.color }}
                  >
                    {activeConv.initials}
                  </div>
                  <div className="chat-typing-bubble">
                    <div className="chat-typing-dot" />
                    <div className="chat-typing-dot" />
                    <div className="chat-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Suggestions */}
            {activeConv.quickReplies && activeConv.quickReplies.length > 0 && (
              <div className="chat-quick-replies">
                {activeConv.quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    className="quick-reply-pill"
                    onClick={() => handleSendMessage(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form 
              className="chat-composer-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                className="chat-composer-input"
                placeholder={`Reply to ${activeConv.name.split(" ")[0]}...`}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                autoFocus
              />
              <button 
                type="submit" 
                className="chat-send-btn" 
                disabled={!replyInput.trim() || isTyping}
                title="Send Message"
              >
                <FiSend size={16} />
              </button>
            </form>
          </div>
        ) : (
          /* =======================================================
             CONVERSATIONS LIST VIEW
             ======================================================= */
          <>
            {/* Search & Filter Controls */}
            <div className="messages-controls-bar">
              <div className="messages-search-wrapper">
                <FiSearch className="messages-search-icon" />
                <input
                  type="text"
                  className="messages-search-input"
                  placeholder="Search messages, recruiters, jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="messages-search-clear" 
                    onClick={() => setSearchQuery("")}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              <div className="messages-filter-pills">
                <button
                  type="button"
                  className={`messages-filter-pill ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`messages-filter-pill ${filter === "unread" ? "active" : ""}`}
                  onClick={() => setFilter("unread")}
                >
                  Unread {unreadTotal > 0 && `(${unreadTotal})`}
                </button>
                <button
                  type="button"
                  className={`messages-filter-pill ${filter === "archived" ? "active" : ""}`}
                  onClick={() => setFilter("archived")}
                >
                  Archived
                </button>
              </div>
            </div>

            {/* List */}
            <div className="conversation-list-scroll">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((c) => {
                  const lastMsg = c.messages[c.messages.length - 1];
                  return (
                    <div
                      key={c.id}
                      className={`conversation-card ${c.unread ? "unread" : ""}`}
                      onClick={() => handleSelectConversation(c.id)}
                    >
                      <div className="conversation-avatar-box">
                        <div 
                          className="conversation-avatar" 
                          style={{ backgroundColor: c.color }}
                        >
                          {c.initials}
                        </div>
                        <div className="conversation-online-badge" />
                      </div>

                      <div className="conversation-body">
                        <div className="conversation-top-line">
                          <span className="conversation-name">{c.name}</span>
                          <span className="conversation-time">{c.lastTime}</span>
                        </div>
                        <div className="conversation-company-role">
                          {c.company} • {c.role}
                        </div>
                        <div className="conversation-last-snippet">
                          {lastMsg ? (
                            <span>
                              {lastMsg.sender === "user" ? "You: " : ""}
                              {lastMsg.text}
                            </span>
                          ) : (
                            "No messages yet"
                          )}
                        </div>
                      </div>

                      {c.unread && <div className="conversation-unread-dot" />}
                    </div>
                  );
                })
              ) : (
                <div className="messages-empty-state">
                  <div className="messages-empty-icon">
                    <BsChatSquareTextFill />
                  </div>
                  <div className="messages-empty-title">
                    {searchQuery ? "No matching conversations" : "No messages found"}
                  </div>
                  <div className="messages-empty-desc">
                    {searchQuery
                      ? "Try searching for another recruiter name or keyword."
                      : filter === "unread"
                      ? "You are all caught up! No unread messages."
                      : "When employers or recruiters reach out regarding your applications, their conversations will appear here."}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
