import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  Megaphone,
  Clock,
  Shield,
  RefreshCw,
  Loader2,
  Inbox,
  CheckCheck,
  ExternalLink,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getMyMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  notifyMessagesUpdated,
} from "../Services/messageService";

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function NotificationInboxModal({ isOpen, onClose, onUnreadCountChange }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch messages from backend
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyMessages({ page: 1, limit: 50 });
      if (res?.success) {
        const msgs = res.messages || [];
        setMessages(msgs);
        const unread = typeof res.unreadCount === "number"
          ? res.unreadCount
          : msgs.filter((m) => !m.isRead).length;
        setUnreadCount(unread);
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (err) {
      console.warn("Failed to fetch official messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, fetchMessages]);

  // Initial fetch on mount to sync badge
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Listen for global message updates
  useEffect(() => {
    const handleSync = (e) => {
      if (typeof e.detail?.unreadCount === "number") {
        setUnreadCount(e.detail.unreadCount);
        if (onUnreadCountChange) onUnreadCountChange(e.detail.unreadCount);
      }
    };
    window.addEventListener("skillbridge_official_messages_updated", handleSync);
    return () => {
      window.removeEventListener("skillbridge_official_messages_updated", handleSync);
    };
  }, [onUnreadCountChange]);

  // Mark single message as read with optimistic update
  const handleOpenMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (onUnreadCountChange) onUnreadCountChange(next);
        notifyMessagesUpdated(next);
        return next;
      });

      // Async backend update
      markMessageAsRead(msg._id).catch((err) => {
        console.error("Error marking message as read:", err);
      });
    }
  };

  // Mark all messages as read with optimistic update
  const handleMarkAllRead = async () => {
    // Optimistic client update
    setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    setUnreadCount(0);
    if (onUnreadCountChange) onUnreadCountChange(0);
    notifyMessagesUpdated(0);

    try {
      await markAllMessagesAsRead();
      toast.success("All messages marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all messages as read");
    }
  };

  const handleNavigateToDashboardMessages = () => {
    if (onClose) onClose();
    window.dispatchEvent(new CustomEvent("skillbridge_open_messages"));
  };

  const filteredMessages = messages.filter((m) => {
    if (activeTab === "unread") return !m.isRead;
    return true;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-xs">
            <AlertTriangle size={11} className="text-rose-600" />
            Urgent Action Required
          </span>
        );
      case "announcement":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-xs">
            <Megaphone size={11} className="text-purple-600" />
            Platform Update
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Info size={11} className="text-slate-500" />
            Notice
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10005] overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer / Modal Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Bell size={19} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
                  <span>Official Messages & Alerts</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">SkillBridge Platform Communications</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchMessages}
                disabled={isLoading}
                title="Refresh messages"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin text-blue-600" : ""} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Subheader: Segmented Filters & Mark All as Read */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unread")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "unread"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Messages List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-1">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-xs">Loading communications...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Inbox size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Messages</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {activeTab === "unread"
                    ? "You are all caught up! No unread messages or announcements."
                    : "You do not have any official notices or announcements at this time."}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    !msg.isRead
                      ? "bg-blue-50/70 hover:bg-blue-50/90 border-blue-200/80 shadow-xs"
                      : "hover:bg-slate-50 bg-white border-slate-100"
                  }`}
                >
                  {/* Top Bar: Title + Unread Indicator + Date */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {!msg.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
                      )}
                      <span className={`text-xs truncate ${!msg.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                        {msg.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                      <Clock size={10} />
                      {formatTimeAgo(msg.createdAt)}
                    </span>
                  </div>

                  {/* Priority Chip */}
                  <div className="mb-2">
                    {getPriorityBadge(msg.priority)}
                  </div>

                  {/* Truncated Preview */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
                    {msg.content}
                  </p>

                  {/* Footer Meta */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100/60">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Shield size={12} className="text-blue-500" />
                      {msg.sender?.name || "SkillBridge Administration"}
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      Read more &rarr;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar with Navigation Option */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">SkillBridge Verified Communications</span>
            <button
              type="button"
              onClick={handleNavigateToDashboardMessages}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1 text-xs"
            >
              <span>View in Hub</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">Official Communication</span>
                  <span className="text-[10px] text-slate-500">{selectedMessage.sender?.name || "SkillBridge Administration"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subject & Priority */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-base font-bold text-slate-900 leading-snug">{selectedMessage.title}</h4>
                {getPriorityBadge(selectedMessage.priority)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                {new Date(selectedMessage.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>

            {/* Message Body */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto font-sans">
              {selectedMessage.content}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Read receipt logged</span>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
