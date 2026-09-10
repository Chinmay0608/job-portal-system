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
    <div
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-[10000] flex justify-end animate-fade-in-simple"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full sm:w-[520px] max-w-full h-full bg-white flex flex-col shadow-2xl animate-slide-in-right relative overflow-hidden font-sans border-l border-surface-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BsChatSquareTextFill size={20} className="text-brand-600" />
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight m-0">Messages</h2>
              {unreadTotal > 0 && (
                <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full tracking-wide">
                  {unreadTotal} Unread
                </span>
              )}
            </div>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors border-0 bg-transparent cursor-pointer"
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
          <div className="flex-1 flex flex-col h-full bg-slate-50 min-h-0">
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-surface-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  type="button" 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer shrink-0"
                  onClick={() => setActiveId(null)}
                  title="Back to conversations"
                >
                  <FiArrowLeft size={18} />
                </button>
                <div 
                  className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-extrabold text-xs tracking-tight shadow-sm shrink-0"
                  style={{ backgroundColor: activeConv.color }}
                >
                  {activeConv.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 leading-tight truncate">{activeConv.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                    <span className="text-brand-600 font-semibold">{activeConv.company}</span>
                    <span>•</span>
                    <span>{activeConv.role}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer shrink-0"
                onClick={(e) => handleToggleArchive(activeConv.id, e)}
                title={activeConv.archived ? "Unarchive conversation" : "Archive conversation"}
              >
                <FiArchive size={16} className={activeConv.archived ? "text-brand-600" : "text-slate-500"} />
              </button>
            </div>

            {/* Target Job Reference Pill */}
            {activeConv.jobTitle && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 font-semibold flex items-center gap-2 shrink-0">
                <FiBriefcase size={14} />
                <span>Regarding: {activeConv.jobTitle}</span>
              </div>
            )}

            {/* Thread Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 min-h-0">
              <div className="text-center my-2.5 relative">
                <span className="bg-slate-200 text-slate-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                  Recent Conversation
                </span>
              </div>

              {activeConv.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-2.5 max-w-[88%] sm:max-w-[82%] ${
                    msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  {msg.sender === "recruiter" && (
                    <div 
                      className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: activeConv.color }}
                    >
                      {activeConv.initials}
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div 
                      className={`p-3 rounded-2xl text-sm leading-relaxed break-words ${
                        msg.sender === "user"
                          ? "bg-brand-600 text-white rounded-tr-sm shadow-md"
                          : "bg-white text-slate-800 border border-surface-border rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] mt-1 text-slate-400 ${
                      msg.sender === "user" ? "justify-end" : ""
                    }`}>
                      <span>{msg.time}</span>
                      {msg.sender === "user" && (
                        <BsCheck2All className="text-brand-600 text-sm" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2.5 max-w-[85%] self-start">
                  <div 
                    className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm"
                    style={{ backgroundColor: activeConv.color }}
                  >
                    {activeConv.initials}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-surface-border rounded-2xl rounded-tl-sm shadow-sm w-fit">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing-bounce [animation-delay:-0.32s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing-bounce [animation-delay:-0.16s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-typing-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Suggestions */}
            {activeConv.quickReplies && activeConv.quickReplies.length > 0 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-white border-t border-slate-100 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeConv.quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    className="bg-slate-100 border border-surface-border text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSendMessage(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form 
              className="p-3 sm:px-4 bg-white border-t border-surface-border flex items-center gap-2.5 shrink-0"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white"
                placeholder={`Reply to ${activeConv.name.split(" ")[0]}...`}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                autoFocus
              />
              <button 
                type="submit" 
                className="w-10 h-10 rounded-xl bg-brand-600 text-white border-0 flex items-center justify-center cursor-pointer transition-all hover:bg-brand-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0"
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
            <div className="px-4 py-3 bg-white border-b border-slate-100 shrink-0 space-y-2.5">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-3 text-slate-400 text-sm" />
                <input
                  type="text"
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="Search messages, recruiters, jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${
                    filter === "all"
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${
                    filter === "unread"
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  onClick={() => setFilter("unread")}
                >
                  Unread {unreadTotal > 0 && `(${unreadTotal})`}
                </button>
                <button
                  type="button"
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${
                    filter === "archived"
                      ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  onClick={() => setFilter("archived")}
                >
                  Archived
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2 min-h-0">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((c) => {
                  const lastMsg = c.messages[c.messages.length - 1];
                  return (
                    <div
                      key={c.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors relative ${
                        c.unread ? "bg-blue-50/30" : ""
                      }`}
                      onClick={() => handleSelectConversation(c.id)}
                    >
                      <div className="relative shrink-0">
                        <div 
                          className="w-11 h-11 rounded-xl text-white flex items-center justify-center font-extrabold text-base tracking-tight shadow-sm"
                          style={{ backgroundColor: c.color }}
                        >
                          {c.initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm text-slate-900 truncate ${c.unread ? "font-extrabold" : "font-semibold"}`}>
                            {c.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                            {c.lastTime}
                          </span>
                        </div>
                        <div className="text-xs text-brand-600 font-semibold mb-1 truncate">
                          {c.company} • {c.role}
                        </div>
                        <div className={`text-xs leading-normal truncate ${c.unread ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
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

                      {c.unread && <div className="w-2.5 h-2.5 bg-brand-600 rounded-full shrink-0 self-center ml-2" />}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-600 flex items-center justify-center text-2xl mb-4">
                    <BsChatSquareTextFill />
                  </div>
                  <div className="text-base font-bold text-slate-900 mb-1.5">
                    {searchQuery ? "No matching conversations" : "No messages found"}
                  </div>
                  <div className="text-xs text-slate-500 max-w-xs leading-relaxed">
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
