import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BsBellFill, 
  BsCheck2All, 
  BsBriefcaseFill, 
  BsCalendarEventFill, 
  BsFileEarmarkTextFill, 
  BsEyeFill,
  BsMegaphoneFill,
  BsShieldExclamation,
  BsHeadset,
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { FiX, FiTrash2, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  notifyNotificationsUpdated,
} from "../Services/notificationService";
import toast from "react-hot-toast";

const renderNotificationIcon = (type) => {
  switch (type) {
    case "application_status":
    case "application":
      return <BsBriefcaseFill />;
    case "interview_invite":
    case "interview":
      return <BsCalendarEventFill />;
    case "job_alert":
    case "recommendation":
      return <HiSparkles />;
    case "support_update":
      return <BsHeadset />;
    case "platform_announcement":
      return <BsMegaphoneFill />;
    case "security_alert":
      return <BsShieldExclamation />;
    case "resume":
    case "system":
      return <BsFileEarmarkTextFill />;
    case "view":
      return <BsEyeFill />;
    default:
      return <BsBellFill />;
  }
};

const getIconTypeClass = (type) => {
  switch (type) {
    case "application_status":
    case "application":
      return "bg-blue-50 text-blue-600";
    case "interview_invite":
    case "interview":
      return "bg-purple-50 text-purple-600";
    case "job_alert":
    case "recommendation":
      return "bg-sky-50 text-sky-600";
    case "support_update":
      return "bg-cyan-50 text-cyan-600";
    case "platform_announcement":
      return "bg-fuchsia-50 text-fuchsia-600";
    case "security_alert":
      return "bg-rose-50 text-rose-600";
    case "view":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-emerald-50 text-emerald-600";
  }
};

const getPriorityBorderClass = (priority) => {
  switch (priority) {
    case "urgent":
      return "border-l-4 border-l-rose-600";
    case "high":
      return "border-l-4 border-l-orange-500";
    case "low":
      return "border-l-2 border-l-slate-400";
    case "normal":
    default:
      return "border-l-4 border-l-brand-600";
  }
};

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

export default function NotificationsDrawer({ isOpen, onClose, user, onUnreadCountChange, onOpenMessages }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread"
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real notifications from backend API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await getNotifications({ page: 1, limit: 50 });
      if (res?.success) {
        const notifs = res.notifications || [];
        setNotifications(notifs);
        const unread = typeof res.unreadCount === "number"
          ? res.unreadCount
          : notifs.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Initial fetch on mount to sync badge count
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Mark single notification as read
  const handleCardClick = async (notif) => {
    const notifId = notif._id || notif.id;
    if (!notif.isRead && !notif.read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ((n._id === notifId || n.id === notifId) ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (onUnreadCountChange) onUnreadCountChange(next);
        notifyNotificationsUpdated(next);
        return next;
      });

      try {
        await markAsRead(notifId);
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    // Action routing if actionUrl or link provided
    const targetUrl = notif.actionUrl || notif.link;
    if (targetUrl) {
      onClose();
      if (targetUrl === "messages" || targetUrl === "/messages") {
        if (onOpenMessages) onOpenMessages();
        else window.dispatchEvent(new CustomEvent("skillbridge_open_messages"));
      } else {
        if (notif.type === "support_update" || targetUrl.includes("/admin")) {
          window.dispatchEvent(new CustomEvent("skillbridge_open_admin_support"));
        }
        navigate(targetUrl);
      }
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    setUnreadCount(0);
    if (onUnreadCountChange) onUnreadCountChange(0);
    notifyNotificationsUpdated(0);

    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Failed to mark all as read");
    }
  };

  // Delete notification
  const handleDelete = async (notifId, e) => {
    e.stopPropagation();
    const targetNotif = notifications.find((n) => (n._id === notifId || n.id === notifId));
    const wasUnread = targetNotif && !targetNotif.isRead && !targetNotif.read;

    setNotifications((prev) => prev.filter((n) => n._id !== notifId && n.id !== notifId));
    if (wasUnread) {
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (onUnreadCountChange) onUnreadCountChange(next);
        notifyNotificationsUpdated(next);
        return next;
      });
    }

    try {
      await deleteNotification(notifId);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const isUnread = !n.isRead && !n.read;
    if (activeTab === "unread") return isUnread;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-[10000] flex justify-end animate-fade-in-simple"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full sm:w-[480px] max-w-full h-full bg-white flex flex-col shadow-2xl animate-slide-in-right relative overflow-hidden font-sans border-l border-surface-border" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BsBellFill size={20} className="text-brand-600" />
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight m-0">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full tracking-wide">
                  {unreadCount} New
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
              onClick={fetchNotifications}
              disabled={isLoading}
              title="Refresh notifications"
            >
              <FiRefreshCw size={15} className={isLoading ? "animate-spin text-brand-600" : ""} />
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:text-brand-700 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer bg-white"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <BsCheck2All size={15} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors border-0 bg-transparent cursor-pointer"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Filter Tabs: All vs Unread */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-b border-slate-100 shrink-0 overflow-x-auto">
          <button
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border ${
              activeTab === "all"
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "all" ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"}`}>
              {notifications.length}
            </span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border ${
              activeTab === "unread"
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab("unread")}
          >
            Unread
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "unread" ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"}`}>
              {unreadCount}
            </span>
          </button>
        </div>

        {/* Notification List Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 min-h-0">
          {isLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mb-4 animate-pulse">🔔</div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Loading alerts...</h3>
              <p className="text-xs text-slate-500">Fetching your latest updates</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mb-4">🔔</div>
              <h3 className="text-base font-bold text-slate-800 mb-1">{activeTab === "unread" ? "No unread alerts" : "All caught up!"}</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {activeTab === "unread"
                  ? "You have reviewed all current notifications."
                  : "We'll notify you when employers review your applications or send updates."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const notifId = item._id || item.id;
              const isUnread = !item.isRead && !item.read;
              const priority = item.priority || "normal";
              const targetUrl = item.actionUrl || item.link;

              return (
                <div
                  key={notifId}
                  className={`group relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                    isUnread
                      ? "bg-blue-50/40 border-blue-200 shadow-sm"
                      : "bg-white border-surface-border"
                  } ${getPriorityBorderClass(priority)}`}
                  onClick={() => handleCardClick(item)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm ${getIconTypeClass(item.type)}`}>
                    {renderNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 m-0 leading-snug truncate">{item.title}</h4>
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">
                        {item.createdAt ? formatTimeAgo(item.createdAt) : (item.time || "")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed m-0 mb-2">{item.message}</p>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {item.type ? item.type.replace(/_/g, " ").toUpperCase() : "ALERT"}
                      </span>

                      <div className="flex items-center gap-2">
                        {targetUrl && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                            <span>Open</span>
                            <FiArrowRight size={13} />
                          </span>
                        )}
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center opacity-60 group-hover:opacity-100"
                          onClick={(e) => handleDelete(notifId, e)}
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-surface-border bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <p className="m-0">SkillBridge In-App Notification Center &bull; Live Updates</p>
        </div>
      </div>
    </div>
  );
}
