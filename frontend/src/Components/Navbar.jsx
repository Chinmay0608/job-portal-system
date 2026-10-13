import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { MoreVertical, MessageSquare, Bell, Compass, UserRound } from "lucide-react";
import { 
  BsBookmarkFill, 
  BsChatSquareTextFill, 
  BsBellFill, 
  BsPersonFill, 
  BsBoxArrowRight 
} from "react-icons/bs";
import { FiMenu, FiX, FiArrowLeft, FiHome } from "react-icons/fi";
import { logoutUser, getStoredUser, notifyAuthChanged } from "../Services/authUtils";
import SkillBridgeLogo from "./SkillBridgeLogo";
import AIChatWidget from "./AIChatWidget";
import MessagesDrawer from "./MessagesDrawer";
import { getUnreadMessagesCount, getUnreadCount } from "../Services/messageService";
import NotificationsDrawer from "./NotificationsDrawer";
import { getUnreadNotificationsCountAPI } from "../Services/notificationService";
import useVoiceRecognition from "../hooks/useVoiceRecognition";

function Navbar() {
  const [user, setUser] = useState(getStoredUser);
  const isLoggedIn = Boolean(user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCandidateMenuOpen, setIsCandidateMenuOpen] = useState(false);
  const candidateMenuRef = useRef(null);
  const navLinksRef = useRef(null);
  const homeTabRef = useRef(null);
  const jobsTabRef = useRef(null);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const [isDhruvOpen, setIsDhruvOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(() => getUnreadMessagesCount(user));
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const profileCompletion = user
    ? Math.round(([
        user.name,
        user.email,
        user.phone,
        user.location,
        user.linkedin,
        user.github,
        user.portfolio,
        user.about,
        user.education,
        user.experienceLevel,
        user.skills?.length > 0,
        user.resume,
        user.profileImage,
      ].filter(Boolean).length / 13) * 100)
    : 0;

  const voiceRec = useVoiceRecognition();
  const { 
    listenForWakeWord, 
    stopWakeWord, 
    isSupported: isVoiceSupported, 
    isWakeListening 
  } = voiceRec;

  const [dhruvAutoVoice, setDhruvAutoVoice] = useState(false);
  const [dhruvInitialQuery, setDhruvInitialQuery] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getStoredUser();
      setUser(currentUser);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("skillbridge_auth_changed", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("skillbridge_auth_changed", checkAuth);
    };
  }, [location.pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
    setIsCandidateMenuOpen(false);
    setIsDhruvOpen(false);
    setIsMessagesOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCandidateMenuOpen) return;
    const closeOnOutsideClick = (event) => {
      if (!candidateMenuRef.current?.contains(event.target)) setIsCandidateMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsCandidateMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCandidateMenuOpen]);

  useEffect(() => {
    if (!user) {
      setUnreadMessagesCount(0);
      return;
    }

    let isMounted = true;
    const updateUnread = async (e) => {
      if (e?.detail && typeof e.detail.unreadCount === "number") {
        if (isMounted) setUnreadMessagesCount(e.detail.unreadCount + getUnreadMessagesCount(user));
        return;
      }
      try {
        const count = await getUnreadCount();
        if (isMounted) setUnreadMessagesCount(count + getUnreadMessagesCount(user));
      } catch (err) {
        console.warn("Error fetching unread message count:", err);
      }
    };

    updateUnread();
    window.addEventListener("skillbridge_messages_updated", updateUnread);
    window.addEventListener("skillbridge_official_messages_updated", updateUnread);
    const handleOpenMessages = () => setIsMessagesOpen(true);
    window.addEventListener("skillbridge_open_messages", handleOpenMessages);

    return () => {
      isMounted = false;
      window.removeEventListener("skillbridge_messages_updated", updateUnread);
      window.removeEventListener("skillbridge_official_messages_updated", updateUnread);
      window.removeEventListener("skillbridge_open_messages", handleOpenMessages);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadNotificationsCount(0);
      return;
    }

    let isMounted = true;
    const fetchNotificationsUnread = async () => {
      try {
        const count = await getUnreadNotificationsCountAPI();
        if (isMounted && typeof count === "number") {
          setUnreadNotificationsCount(count);
        }
      } catch (err) {
        console.warn("Error fetching unread notifications count:", err);
      }
    };

    fetchNotificationsUnread();

    const handleNotificationsSync = (e) => {
      if (typeof e.detail?.unreadCount === "number") {
        setUnreadNotificationsCount(e.detail.unreadCount);
      } else {
        fetchNotificationsUnread();
      }
    };

    window.addEventListener("skillbridge_notifications_updated", handleNotificationsSync);
    const handleOpenNotifications = () => setIsNotificationsOpen(true);
    window.addEventListener("skillbridge_open_notifications", handleOpenNotifications);

    const pollInterval = setInterval(fetchNotificationsUnread, 45000);

    return () => {
      isMounted = false;
      window.removeEventListener("skillbridge_notifications_updated", handleNotificationsSync);
      window.removeEventListener("skillbridge_open_notifications", handleOpenNotifications);
      clearInterval(pollInterval);
    };
  }, [user]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isHome = location.pathname === "/";
  const isCandidateDashboard = location.pathname === "/candidate-dashboard";
  const isJobsTab = isCandidateDashboard && new URLSearchParams(location.search).get("tab") === "jobs";
  const isRecruiterDashboard = location.pathname === "/recruiter-dashboard";
  const isAdminDashboard = location.pathname === "/admin-dashboard" || location.pathname.startsWith("/admin");
  const isMyApplications = location.pathname === "/my-applications";

  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = isJobsTab ? jobsTabRef.current : homeTabRef.current;
      const nav = navLinksRef.current;
      if (!activeTab || !nav) return;
      setTabIndicator({ left: activeTab.offsetLeft, width: activeTab.offsetWidth });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [isJobsTab, location.pathname, user?.role]);

  // DHRUV AI Assistant is strictly restricted to logged-in candidates in their dashboard / workspace
  // Also gated behind VITE_DHRUV_ENABLED=true so it never loads on production until fully trained
  const isDhruvEnabled = import.meta.env.VITE_DHRUV_ENABLED === "true";
  const canAccessAI = Boolean(isDhruvEnabled && isLoggedIn && user && user.role === "candidate" && !isHome);

  // Global background wake word detection ("Hey Dhruv" - like Siri / Alexa)
  // Strict rule: ONLY start microphone if user is logged in to their candidate dashboard
  useEffect(() => {
    if (!canAccessAI || isDhruvOpen || !isVoiceSupported) {
      stopWakeWord();
      return;
    }

    listenForWakeWord((promptAfterWake) => {
      toast.success("Hey Dhruv! I'm listening...", { icon: "🎙️", duration: 3000 });
      if (promptAfterWake && promptAfterWake.length > 2) {
        setDhruvInitialQuery(promptAfterWake);
        setDhruvAutoVoice(false);
      } else {
        setDhruvInitialQuery("");
        setDhruvAutoVoice(true);
      }
      setIsDhruvOpen(true);
    });

    return () => {
      stopWakeWord();
    };
  }, [canAccessAI, isDhruvOpen, isVoiceSupported, listenForWakeWord, stopWakeWord]);

  const getDashboardUrl = () => {
    if (!isLoggedIn) return "/";
    if (user?.role === "recruiter") return "/recruiter-dashboard";
    if (user?.role === "admin") return "/admin-dashboard";
    return "/candidate-dashboard";
  };
  const dashboardUrl = getDashboardUrl();

  const isMainDashboard = isHome || isCandidateDashboard || isRecruiterDashboard || isAdminDashboard;
  const canGoBack = !isMainDashboard;

  const handleGoBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(dashboardUrl);
    }
  };

  const logout = async (e) => {
    if (e) e.preventDefault();
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      notifyAuthChanged();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNotificationClick = () => {
    setIsNotificationsOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleMessageClick = () => {
    setIsMessagesOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="indeed-navbar">
      <div className="navbar-container">
        {/* Left Section: Back Button + Logo + Main Text Links */}
        <div className="nav-left">
          {canGoBack && (
            <button 
              type="button"
              className="header-back-btn" 
              onClick={handleGoBack}
              aria-label="Go back"
              title="Go back"
            >
              <FiArrowLeft size={19} />
              <span className="back-btn-label">Back</span>
            </button>
          )}

          <Link 
            className="navbar-brand-logo" 
            to={dashboardUrl}
            onClick={(e) => {
              if (isLoggedIn && location.pathname === dashboardUrl) {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            <SkillBridgeLogo width={176} className="brand-svg-logo" />
          </Link>

          {/* Left Text Navigation Links (Only on inner app pages, not landing page) */}
          {!isHome && (
            <div ref={navLinksRef} className={`nav-links-left desktop-only ${user?.role === "candidate" ? "has-moving-indicator" : ""}`}>
              {(!isLoggedIn || user?.role === "candidate") && (
                <Link 
                  ref={user?.role === "candidate" ? homeTabRef : undefined}
                  to={isLoggedIn ? "/candidate-dashboard" : "/"} 
                  className={`nav-tab-link ${isCandidateDashboard && !isJobsTab ? "active" : ""}`}
                >
                  Home
                </Link>
              )}
              {user?.role === "candidate" && (
                <Link ref={jobsTabRef} to="/candidate-dashboard?tab=jobs" className={`nav-tab-link ${isJobsTab ? "active" : ""}`}>
                  Jobs
                </Link>
              )}
              {user?.role === "candidate" && (
                <span
                  className="nav-tab-indicator"
                  aria-hidden="true"
                  style={{ width: `${tabIndicator.width}px`, transform: `translateX(${tabIndicator.left}px)` }}
                />
              )}

              {user?.role === "recruiter" && (
                <>
                  <Link 
                    to="/recruiter-dashboard" 
                    className={`nav-tab-link ${location.pathname === "/recruiter-dashboard" ? "active" : ""}`}
                  >
                    Manage Jobs
                  </Link>
                  <Link 
                    to="/recruiter-applications" 
                    className={`nav-tab-link ${location.pathname === "/recruiter-applications" ? "active" : ""}`}
                  >
                    Applicants
                  </Link>
                </>
              )}
              {user?.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className={`nav-tab-link ${location.pathname.includes("/admin") ? "active" : ""}`}
                >
                  Admin System
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Middle Section: DHRUV AI Assistant (Logged-in candidates only) */}
        {canAccessAI && (
          <div className="nav-center">
            {canAccessAI && (
              <button
                type="button"
                className={`header-dhruv-btn ${isWakeListening ? "wake-listening" : ""}`}
                onClick={() => {
                  setDhruvAutoVoice(false);
                  setDhruvInitialQuery("");
                  setIsDhruvOpen((prev) => !prev);
                }}
                aria-label="Ask DHRUV AI Career Coach"
                title={
                  isWakeListening
                    ? "DHRUV is listening for 'Hey Dhruv' (Click to open)"
                    : "Ask DHRUV - AI Career Coach (Voice & 'Hey Dhruv' Enabled)"
                }
              >
                <svg className="dhruv-sparkles-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                  <path d="m23 15-3-9m21 10 4-9" stroke="#9be5ff" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="45" cy="6" r="4" fill="#8bdcff" />
                  <path d="m11 21-6-2m9-6-4-5m-2 19-6-1" stroke="#8bdcff" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M48 13c8 0 13 5 13 12s-5 12-13 12h-1l-6 6v-8c-4-2-6-6-6-10 0-7 5-12 13-12Z" fill="#67c9ff" />
                  <circle cx="48" cy="25" r="1.7" fill="#fff" />
                  <circle cx="54" cy="25" r="1.7" fill="#fff" />
                  <circle cx="60" cy="25" r="1.7" fill="#fff" />
                  <path d="M15 43c-7-2-10 5-5 10l8 7 9-5m13-12c7-2 10 5 5 10l-8 7-9-5" fill="#a4e1ff" stroke="#f5faff" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M25 17 21 9m18 8 4-8" stroke="#d8f3ff" strokeWidth="2" strokeLinecap="round" />
                  <rect x="12" y="17" width="40" height="37" rx="18" fill="#172c9c" stroke="#f7fbff" strokeWidth="4" />
                  <rect x="10" y="29" width="6" height="13" rx="3" fill="#72ceff" />
                  <rect x="48" y="29" width="6" height="13" rx="3" fill="#72ceff" />
                  <path d="M25 35v2m14-2v2" stroke="#8be5ff" strokeWidth="4.5" strokeLinecap="round" />
                </svg>
                <span className="dhruv-divider" aria-hidden="true" />
                <span className="dhruv-btn-text">ASK</span>
                <svg className="dhruv-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {isWakeListening && <span className="dhruv-listening-indicator" title="Microphone listening for 'Hey Dhruv'" />}
              </button>
            )}
          </div>
        )}

        {/* Mobile Header Controls: Home Button + Hamburger Toggle */}
        <div className="mobile-header-controls">
          {!isHome && (
            <Link
              to={dashboardUrl}
              className={`header-home-btn ${(isCandidateDashboard || isRecruiterDashboard) ? "active" : ""}`}
              aria-label="Home"
              title="Go to Home"
            >
              <FiHome size={18} />
              <span className="home-btn-label">Home</span>
            </Link>
          )}

          <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle navigation">
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Right Section: Auth Buttons (Landing / Guest) OR Application Action Bar (Inner Dashboard Pages) */}
        <div className={`nav-right ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          {(!isLoggedIn || isHome) ? (
            <div className="auth-buttons">
              {!isHome && (
                <Link className="nav-tab-link mobile-only-tab" to="/" style={{ padding: "8px 0", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiHome size={18} /> Home
                </Link>
              )}
              <Link className="login-btn nav-hover" to="/login">Login</Link>
              <Link className="signup-btn nav-hover" to="/register">Sign Up</Link>
            </div>
          ) : (
            <div className="user-icon-bar">
              {/* Candidates Icon Suite */}
              {user?.role === "candidate" && (
                <>
                  {/* Home (Mobile Drawer) */}
                  <div className={`icon-tab-wrapper mobile-only-tab ${isCandidateDashboard ? "active" : ""}`}>
                    <Link to="/candidate-dashboard" className="icon-btn-link" aria-label="Home">
                      <FiHome className="header-icon" />
                      <span className="mobile-only-label">Home</span>
                    </Link>
                  </div>

                  {/* Bookmark Icon (My Applications) */}
                  <div className={`icon-tab-wrapper ${isMyApplications ? "active" : ""}`}>
                    <Link to="/my-applications" className="icon-btn-link" aria-label="My applications">
                      <BsBookmarkFill className="header-icon" />
                      <span className="mobile-only-label">My applications</span>
                    </Link>
                    <div className="tooltip-bubble">My applications</div>
                  </div>

                  {/* Profile User Icon */}
                  <div className={`icon-tab-wrapper ${location.pathname === "/candidate-profile" ? "active" : ""}`}>
                    <Link to="/candidate-profile" className="icon-btn-link" aria-label="Profile">
                      <BsPersonFill className="header-icon" />
                      <span className="mobile-only-label">Profile</span>
                    </Link>
                    <div className="tooltip-bubble">Profile</div>
                  </div>
                </>
              )}

              {/* Recruiter Icon Suite */}
              {user?.role === "recruiter" && (
                <>
                  {/* Home (Mobile Drawer) */}
                  <div className={`icon-tab-wrapper mobile-only-tab ${isRecruiterDashboard ? "active" : ""}`}>
                    <Link to="/recruiter-dashboard" className="icon-btn-link" aria-label="Home">
                      <FiHome className="header-icon" />
                      <span className="mobile-only-label">Home</span>
                    </Link>
                  </div>

                  {/* Recruiter Message Icon */}
                  <div className="icon-tab-wrapper">
                    <button type="button" className="icon-btn-link" onClick={handleMessageClick} aria-label="Messages">
                      <span className="icon-with-badge">
                        <BsChatSquareTextFill className="header-icon" />
                        {unreadMessagesCount > 0 && (
                          <span className="nav-unread-dot" title={`${unreadMessagesCount} unread`} />
                        )}
                      </span>
                      <span className="mobile-only-label">
                        Messages
                        {unreadMessagesCount > 0 && (
                          <span className="nav-unread-badge">{unreadMessagesCount}</span>
                        )}
                      </span>
                    </button>
                    <div className="tooltip-bubble">Messages</div>
                  </div>

                  {/* Recruiter Bell Icon */}
                  <div className="icon-tab-wrapper">
                    <button type="button" className="icon-btn-link" onClick={handleNotificationClick} aria-label="Official Notifications">
                      <span className="icon-with-badge">
                        <BsBellFill className="header-icon" />
                        {unreadNotificationsCount > 0 && (
                          <span className="nav-unread-count-pill" title={`${unreadNotificationsCount} unread official alerts`}>
                            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                          </span>
                        )}
                      </span>
                      <span className="mobile-only-label">
                        Notifications
                        {unreadNotificationsCount > 0 && (
                          <span className="nav-unread-badge">{unreadNotificationsCount}</span>
                        )}
                      </span>
                    </button>
                    <div className="tooltip-bubble">Notifications</div>
                  </div>

                  <div className={`icon-tab-wrapper ${location.pathname === "/recruiter-profile" ? "active" : ""}`}>
                    <Link to="/recruiter-profile" className="icon-btn-link" aria-label="Profile">
                      <BsPersonFill className="header-icon" />
                      <span className="mobile-only-label">Profile</span>
                    </Link>
                    <div className="tooltip-bubble">Profile</div>
                  </div>
                </>
              )}

              {/* Vertical Separator Divider & Employers / Post Job Link (Recruiters & Guests only) */}
              {user?.role === "recruiter" && (
                <>
                  <div className="nav-divider desktop-only"></div>
                  <Link 
                    to="/recruiter-dashboard" 
                    className="employer-post-link desktop-only"
                  >
                    Employers / Post Job
                  </Link>
                </>
              )}

              {user?.role === "candidate" && (
                <div className="icon-tab-wrapper" ref={candidateMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsCandidateMenuOpen((open) => !open)}
                    aria-label={`Open account menu${unreadMessagesCount > 0 || unreadNotificationsCount > 0 ? ", unread messages or notifications" : ""}`}
                    aria-haspopup="menu"
                    aria-expanded={isCandidateMenuOpen}
                    title="Account menu"
                    className="icon-btn-link candidate-menu-trigger"
                  >
                    <MoreVertical size={20} className="header-icon" />
                    <span className="mobile-only-label">Account menu</span>
                    {(unreadMessagesCount > 0 || unreadNotificationsCount > 0) && (
                      <span className="candidate-menu-unread-dot" aria-hidden="true" />
                    )}
                  </button>
                  <div className="tooltip-bubble">Account menu</div>
                  {isCandidateMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Account options"
                      className="nav-account-menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCandidateMenuOpen(false);
                          handleMessageClick();
                        }}
                        className="nav-account-menu-item"
                      >
                        <span className="nav-account-menu-icon"><MessageSquare size={16} /></span>
                        Messages
                        {unreadMessagesCount > 0 && <span className="nav-account-menu-count">{unreadMessagesCount}</span>}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCandidateMenuOpen(false);
                          handleNotificationClick();
                        }}
                        className="nav-account-menu-item"
                      >
                        <span className="nav-account-menu-icon"><Bell size={16} /></span>
                        Notifications
                        {unreadNotificationsCount > 0 && <span className="nav-account-menu-count">{unreadNotificationsCount}</span>}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCandidateMenuOpen(false);
                          navigate("/candidate-dashboard", { state: { openGuidedTour: true } });
                        }}
                        className="nav-account-menu-item"
                      >
                        <span className="nav-account-menu-icon"><Compass size={16} /></span>
                        Guided Tour
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsCandidateMenuOpen(false);
                          navigate("/candidate-profile");
                        }}
                        className="nav-account-menu-item"
                      >
                        <span className="nav-account-menu-icon"><UserRound size={16} /></span>
                        Profile {profileCompletion}%
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Logout Button */}
              <button 
                type="button" 
                className="logout-icon-btn" 
                onClick={logout}
                aria-label="Sign out"
              >
                <BsBoxArrowRight className="logout-icon" />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DHRUV AI Career Coach Drawer (Logged-in candidates only) */}
      {canAccessAI && (
        <AIChatWidget
          user={user}
          isOpen={isDhruvOpen}
          setIsOpen={setIsDhruvOpen}
          hideFloatingTrigger={true}
          autoStartVoice={dhruvAutoVoice}
          initialQuery={dhruvInitialQuery}
        />
      )}
      {/* Messages Drawer */}
      <MessagesDrawer
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        user={user}
      />

      {/* Multi-Role In-App Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        user={user}
        onUnreadCountChange={setUnreadNotificationsCount}
      />
    </nav>
  );
}

export default Navbar;
