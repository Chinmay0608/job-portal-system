import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BsBellFill, 
  BsCheck2All, 
  BsBriefcaseFill, 
  BsCalendarEventFill, 
  BsFileEarmarkTextFill, 
  BsEyeFill 
} from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";
import { FiX, FiTrash2, FiArrowRight } from "react-icons/fi";
import { 
  NOTIFICATIONS_STORAGE_KEY_PREFIX, 
  INITIAL_NOTIFICATIONS_CANDIDATE, 
  INITIAL_NOTIFICATIONS_RECRUITER 
} from "../Services/notificationService";
import "../Styles/components/NotificationsDrawer.css";

const renderNotificationIcon = (type) => {
  switch (type) {
    case "application":
      return <BsBriefcaseFill />;
    case "interview":
      return <BsCalendarEventFill />;
    case "recommendation":
      return <HiSparkles />;
    case "resume":
    case "system":
      return <BsFileEarmarkTextFill />;
    case "view":
      return <BsEyeFill />;
    default:
      return <BsBellFill />;
  }
};

export default function NotificationsDrawer({ isOpen, onClose, user, onOpenMessages }) {
  const navigate = useNavigate();
  const userKey = NOTIFICATIONS_STORAGE_KEY_PREFIX + (user?._id || user?.email || "guest");

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse notifications from localStorage:", e);
    }
    return user?.role === "recruiter"
      ? INITIAL_NOTIFICATIONS_RECRUITER
      : INITIAL_NOTIFICATIONS_CANDIDATE;
  });

  const [activeTab, setActiveTab] = useState("all");

  // Sync to localStorage and dispatch event for navbar badge
  useEffect(() => {
    try {
      localStorage.setItem(userKey, JSON.stringify(notifications));
      window.dispatchEvent(new Event("skillbridge_notifications_updated"));
    } catch (e) {
      console.error("Failed to save notifications to localStorage:", e);
    }
  }, [notifications, userKey]);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleCardClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleActionClick = (item, e) => {
    e.stopPropagation();
    handleCardClick(item.id);
    onClose();
    if (item.link === "messages") {
      onOpenMessages?.();
    } else if (item.link) {
      navigate(item.link);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "application") return n.type === "application" || n.type === "view";
    if (activeTab === "interview") return n.type === "interview";
    if (activeTab === "system") {
      return n.type === "system" || n.type === "resume" || n.type === "recommendation";
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="notifications-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="notifications-drawer-panel" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notifications-panel-header">
          <div className="notifications-header-left">
            <div className="notifications-title-wrap">
              <BsBellFill size={20} color="#2563eb" />
              <h2 className="notifications-main-title">Notifications</h2>
              {unreadCount > 0 && (
                <span className="notifications-badge">{unreadCount} New</span>
              )}
            </div>
          </div>
          <div className="notifications-header-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications-mark-read-btn"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <BsCheck2All size={15} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              className="notifications-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="notifications-tabs">
          <button
            type="button"
            className={`notif-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
            <span className="notif-tab-count">{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`notif-tab-btn ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            Unread
            <span className="notif-tab-count">{unreadCount}</span>
          </button>
          <button
            type="button"
            className={`notif-tab-btn ${activeTab === "application" ? "active" : ""}`}
            onClick={() => setActiveTab("application")}
          >
            Applications
          </button>
          <button
            type="button"
            className={`notif-tab-btn ${activeTab === "interview" ? "active" : ""}`}
            onClick={() => setActiveTab("interview")}
          >
            Interviews
          </button>
          <button
            type="button"
            className={`notif-tab-btn ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setActiveTab("system")}
          >
            Alerts
          </button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`notification-card ${!item.read ? "unread" : ""}`}
                onClick={() => handleCardClick(item.id)}
              >
                <div className={`notif-icon-wrap type-${item.type}`}>
                  {renderNotificationIcon(item.type)}
                </div>

                <div className="notif-content-wrap">
                  <div className="notif-header-line">
                    <h4 className="notif-title">{item.title}</h4>
                    <span className="notif-time">{item.time}</span>
                  </div>

                  <p className="notif-message">{item.message}</p>

                  <div className="notif-footer-actions">
                    <span className="notif-tag">{item.tag || item.company}</span>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {item.linkText && (
                        <button
                          type="button"
                          className="notif-action-btn"
                          onClick={(e) => handleActionClick(item, e)}
                        >
                          <span>{item.linkText}</span>
                          <FiArrowRight size={13} />
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="notif-delete-btn"
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="notifications-empty-state">
              <div className="notif-empty-icon">
                <BsBellFill />
              </div>
              <div className="notif-empty-title">
                {activeTab === "unread"
                  ? "You're all caught up!"
                  : "No notifications found"}
              </div>
              <div className="notif-empty-desc">
                {activeTab === "unread"
                  ? "There are no unread alerts at this time."
                  : "When you receive interview invites, job updates, or employer views, they will show up here."}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notifications-panel-footer">
            <span className="notif-footer-text">
              {unreadCount === 0
                ? "All notifications read"
                : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
            </span>
            <button
              type="button"
              className="notif-clear-all-btn"
              onClick={handleClearAll}
              title="Clear all notifications"
            >
              <FiTrash2 size={13} />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
