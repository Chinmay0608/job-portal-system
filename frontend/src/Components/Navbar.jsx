import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMenu, FiX } from "react-icons/fi";
import { logoutUser } from "../Services/authUtils";
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
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
  const isCandidatePage = ["/candidate-dashboard", "/my-applications", "/candidate-profile"].includes(location.pathname);
  const isRecruiterPage = ["/recruiter-dashboard", "/recruiter-applications", "/recruiter-profile"].includes(location.pathname);
  const isDashboardTheme = isCandidatePage || isRecruiterPage;

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

  return (
    <nav className={`custom-navbar glass-navbar${isHome ? " navbar-dark" : ""}${isDashboardTheme ? " candidate-nav" : ""}`}>
      {/* Logo */}
      <Link className="navbar-brand premium-logo" to="/">
        <span className="logo-skill">Skill</span><span className="logo-bridge">Bridge</span>
      </Link>

      {/* Hamburger Toggle */}
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle navigation">
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Right Side Buttons */}
      <div className={`nav-buttons ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        {isHome ? (
          <>
            <Link className="login-btn nav-hover" to="/login">Log In</Link>
            <Link className="signup-btn nav-hover" to="/register">Sign Up</Link>
          </>
        ) : (
          <>
            {/* Candidate Navbar */}
            {user?.role === "candidate" && (
              <>
                <Link className="dashboard-btn nav-hover" to="/candidate-dashboard">Jobs</Link>
                <Link className="dashboard-btn nav-hover" to="/my-applications">My Applications</Link>
                <Link className="dashboard-btn nav-hover" to="/candidate-profile">Profile</Link>
              </>
            )}

            {/* Recruiter Navbar */}
            {user?.role === "recruiter" && (
              <>
                <Link className="dashboard-btn nav-hover" to="/recruiter-dashboard">Jobs</Link>
                <Link className="dashboard-btn nav-hover" to="/recruiter-applications">Applications</Link>
                {user?.email?.toLowerCase() === "admin@gmail.com" && (
                  <Link className="dashboard-btn nav-hover" to="/admin/dashboard">Admin Tools</Link>
                )}
                <Link className="dashboard-btn nav-hover" to="/recruiter-profile">Profile</Link>
              </>
            )}

            {/* Logout */}
            {isLoggedIn && (
              <button type="button" className="logout-btn nav-hover" onClick={logout}>
                Logout
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;