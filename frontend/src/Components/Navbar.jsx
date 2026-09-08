import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  BsBookmarkFill, 
  BsChatSquareTextFill, 
  BsBellFill, 
  BsPersonFill, 
  BsBoxArrowRight 
} from "react-icons/bs";
import { FiMenu, FiX, FiArrowLeft, FiHome } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { logoutUser } from "../Services/authUtils";
import SkillBridgeLogo from "./SkillBridgeLogo";
import AIChatWidget from "./AIChatWidget";
import MessagesDrawer from "./MessagesDrawer";
import { getUnreadMessagesCount } from "../Services/messageService";
import NotificationsDrawer from "./NotificationsDrawer";
import { getUnreadNotificationsCount } from "../Services/notificationService";
import useVoiceRecognition from "../hooks/useVoiceRecognition";
import "../Styles/components/navbar.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDhruvOpen, setIsDhruvOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const [user, setUser] = useState(getUser());
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(() => getUnreadMessagesCount(user));
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(() => getUnreadNotificationsCount(user));

  const voiceRec = useVoiceRecognition();
  const [isWakeWordActive, setIsWakeWordActive] = useState(() => {
    try {
      return localStorage.getItem("dhruv_wake_word_enabled") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getUser();
      setIsLoggedIn(!!currentUser);
      setUser(currentUser);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [location.pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
    setIsDhruvOpen(false);
    setIsMessagesOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateUnread = () => {
      setUnreadMessagesCount(getUnreadMessagesCount(user));
    };
    updateUnread();
    window.addEventListener("skillbridge_messages_updated", updateUnread);
    return () => {
      window.removeEventListener("skillbridge_messages_updated", updateUnread);
    };
  }, [user]);

  useEffect(() => {
    const updateUnreadNotifs = () => {
      setUnreadNotificationsCount(getUnreadNotificationsCount(user));
    };
    updateUnreadNotifs();
    window.addEventListener("skillbridge_notifications_updated", updateUnreadNotifs);
    return () => {
      window.removeEventListener("skillbridge_notifications_updated", updateUnreadNotifs);
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

  // Sync wake word preference with events from AIChatWidget
  useEffect(() => {
    const handleWakeSync = () => {
      try {
        setIsWakeWordActive(localStorage.getItem("dhruv_wake_word_enabled") === "true");
      } catch (e) {
        console.warn(e);
      }
    };
    window.addEventListener("dhruv_wake_word_toggled", handleWakeSync);
    return () => {
      window.removeEventListener("dhruv_wake_word_toggled", handleWakeSync);
    };
  }, []);

  // Background wake word detection when hands-free is enabled
  useEffect(() => {
    if (!isWakeWordActive || isDhruvOpen || !voiceRec.isSupported) {
      voiceRec.stopWakeWord();
      return;
    }

    voiceRec.listenForWakeWord(() => {
      toast.success("Hey Dhruv detected! Opening Career Coach...", { icon: "🎙️" });
      setIsDhruvOpen(true);
    });

    return () => {
      voiceRec.stopWakeWord();
    };
  }, [isWakeWordActive, isDhruvOpen, voiceRec]);

  const isHome = location.pathname === "/";
  const isCandidateDashboard = location.pathname === "/candidate-dashboard";
  const isRecruiterDashboard = location.pathname === "/recruiter-dashboard";
  const isAdminDashboard = location.pathname === "/admin-dashboard" || location.pathname.startsWith("/admin");
  const isMyApplications = location.pathname === "/my-applications";
  const isSalaryGuide = location.pathname === "/salary-data";

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

  // All inner candidate, recruiter, admin & app pages feature the cohesive theme header background (#e8f1ff)
  const isDashboardWavePage = !isHome;

  const logout = async (e) => {
    if (e) e.preventDefault();
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setUser(null);
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
    <nav className={`indeed-navbar${isHome ? " navbar-dark" : ""}${isDashboardWavePage ? " dashboard-nav" : ""}`}>
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
            <SkillBridgeLogo width={160} className="brand-svg-logo" />
          </Link>

          {/* Left Text Navigation Links (Only on inner app pages, not landing page) */}
          {!isHome && (
            <div className="nav-links-left desktop-only">
              {(!isLoggedIn || user?.role === "candidate") && (
                <>
                  <Link 
                    to={isLoggedIn ? "/candidate-dashboard" : "/"} 
                    className={`nav-tab-link ${isCandidateDashboard ? "active" : ""}`}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/salary-data" 
                    className={`nav-tab-link ${isSalaryGuide ? "active" : ""}`}
                  >
                    Salary guide
                  </Link>
                </>
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
                  {user?.email?.toLowerCase() === "admin@gmail.com" && (
                    <Link 
                      to="/admin/dashboard" 
                      className={`nav-tab-link ${location.pathname.includes("/admin") ? "active" : ""}`}
                    >
                      Admin System
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Middle Section: DHRUV AI Assistant */}
        {(!isHome && (!user || user?.role === "candidate")) && (
          <div className="nav-center">
            <button
              type="button"
              className="header-dhruv-btn"
              onClick={() => setIsDhruvOpen((prev) => !prev)}
              aria-label="Ask DHRUV AI Career Coach"
              title="Ask DHRUV - AI Career Coach (Voice & 'Hey Dhruv' Enabled)"
            >
              <HiSparkles className="dhruv-sparkles-icon" />
              <span className="dhruv-btn-text">Ask DHRUV</span>
            </button>
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

                  {/* Bookmark Icon (My Jobs) */}
                  <div className={`icon-tab-wrapper ${isMyApplications ? "active" : ""}`}>
                    <Link to="/my-applications" className="icon-btn-link" aria-label="My jobs">
                      <BsBookmarkFill className="header-icon" />
                      <span className="mobile-only-label">My jobs</span>
                    </Link>
                    <div className="tooltip-bubble">My jobs</div>
                  </div>

                  {/* Message Icon */}
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

                  {/* Bell Icon */}
                  <div className="icon-tab-wrapper">
                    <button type="button" className="icon-btn-link" onClick={handleNotificationClick} aria-label="Notifications">
                      <span className="icon-with-badge">
                        <BsBellFill className="header-icon" />
                        {unreadNotificationsCount > 0 && (
                          <span className="nav-unread-dot" title={`${unreadNotificationsCount} unread`} />
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
                    <button type="button" className="icon-btn-link" onClick={handleNotificationClick} aria-label="Notifications">
                      <span className="icon-with-badge">
                        <BsBellFill className="header-icon" />
                        {unreadNotificationsCount > 0 && (
                          <span className="nav-unread-dot" title={`${unreadNotificationsCount} unread`} />
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

      {/* DHRUV AI Career Coach Drawer */}
      {(!isHome && (!user || user?.role === "candidate")) && (
        <AIChatWidget
          user={user}
          isOpen={isDhruvOpen}
          setIsOpen={setIsDhruvOpen}
          hideFloatingTrigger={true}
        />
      )}

      {/* Messages Drawer */}
      <MessagesDrawer
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        user={user}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        user={user}
        onOpenMessages={() => {
          setIsNotificationsOpen(false);
          setIsMessagesOpen(true);
        }}
      />
    </nav>
  );
}

export default Navbar;