import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  BsBookmarkFill, 
  BsChatSquareTextFill, 
  BsBellFill, 
  BsPersonFill, 
  BsBoxArrowRight 
} from "react-icons/bs";
import { FiMenu, FiX } from "react-icons/fi";
import { logoutUser } from "../Services/authUtils";
import SkillBridgeLogo from "./SkillBridgeLogo";
import "../Styles/components/navbar.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
  const isMyApplications = location.pathname === "/my-applications";
  const isProfile = ["/candidate-profile", "/recruiter-profile"].includes(location.pathname);
  const isSalaryGuide = location.pathname === "/salary-data";
  const isCompanyReviews = location.pathname === "/about";

  // Only main dashboard pages feature the top vector wave background (#e8f1ff).
  // Other candidate/recruiter pages (like /my-applications, /candidate-profile) use clean white/gray background.
  const isDashboardWavePage = ["/candidate-dashboard", "/recruiter-dashboard"].includes(location.pathname) || location.pathname.includes("/admin");

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
    toast("No new notifications", { icon: "🔔" });
  };

  const handleMessageClick = () => {
    toast("No new messages", { icon: "💬" });
  };

  return (
    <nav className={`indeed-navbar${isHome ? " navbar-dark" : ""}${isDashboardWavePage ? " dashboard-nav" : ""}`}>
      <div className="navbar-container">
        {/* Left Section: Logo + Main Text Links */}
        <div className="nav-left">
          <Link 
            className="navbar-brand-logo" 
            to={isLoggedIn ? (user?.role === 'recruiter' ? '/recruiter-dashboard' : user?.role === 'admin' ? '/admin-dashboard' : '/candidate-dashboard') : '/'}
            onClick={(e) => {
              if (isLoggedIn) {
                const dashboardUrl = user?.role === 'recruiter' ? '/recruiter-dashboard' : user?.role === 'admin' ? '/admin-dashboard' : '/candidate-dashboard';
                if (location.pathname === dashboardUrl) {
                  e.preventDefault();
                  window.location.reload();
                }
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

        {/* Mobile Hamburger Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle navigation">
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Right Section: Auth Buttons (Landing / Guest) OR Application Action Bar (Inner Dashboard Pages) */}
        <div className={`nav-right ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          {(!isLoggedIn || isHome) ? (
            <div className="auth-buttons">
              <Link className="login-btn nav-hover" to="/login">Login</Link>
              <Link className="signup-btn nav-hover" to="/register">Sign Up</Link>
            </div>
          ) : (
            <div className="user-icon-bar">
              {/* Candidates Icon Suite */}
              {user?.role === "candidate" && (
                <>
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
                      <BsChatSquareTextFill className="header-icon" />
                      <span className="mobile-only-label">Messages</span>
                    </button>
                    <div className="tooltip-bubble">Messages</div>
                  </div>

                  {/* Bell Icon */}
                  <div className="icon-tab-wrapper">
                    <button type="button" className="icon-btn-link" onClick={handleNotificationClick} aria-label="Notifications">
                      <BsBellFill className="header-icon" />
                      <span className="mobile-only-label">Notifications</span>
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
    </nav>
  );
}

export default Navbar;