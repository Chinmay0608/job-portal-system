import React, {
  useState,
  useEffect,
} from "react";

import "./navbar.css";

import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

function Navbar() {
  const [isLoggedIn,
    setIsLoggedIn] =
    useState(false);

  useEffect(() => {

    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {
      setIsLoggedIn(true);
    }

  }, []);

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const isHome =
    location.pathname === "/";

  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      ) || "null"
    );

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate(
      "/login",
      { replace: true }
    );
  };

  return (
    <nav className="custom-navbar glass-navbar">

      {/* Logo */}

      <Link
        className="navbar-brand premium-logo"
        to="/"
      >
        SkillBridge
      </Link>

      {/* Right Side Buttons */}

      <div className="nav-buttons">

        {isHome ? (

          <>
            <Link
              className="login-btn nav-hover"
              to="/login"
            >
              Log In
            </Link>

            <Link
              className="signup-btn nav-hover"
              to="/register"
            >
              Sign Up
            </Link>
          </>

        ) : (

          <>
            {/* Candidate Navbar */}

            {user?.role ===
              "candidate" && (
              <>
                <Link
                  className="dashboard-btn"
                  to="/candidate-dashboard"
                >
                  Jobs
                </Link>

                <Link
                  className="dashboard-btn"
                  to="/my-applications"
                >
                  My Applications
                </Link>
              </>
            )}

            {/* Recruiter Navbar */}

            {user?.role ===
              "recruiter" && (
              <>
                <Link
                  className="dashboard-btn nav-hover"
                  to="/recruiter-dashboard"
                >
                  Dashboard
                </Link>

                <Link
                  className="dashboard-btn nav-hover"
                  to="/recruiter-applications"
                >
                  Applicants
                </Link>
              </>
            )}

            {/* Logout */}

            {user && (
              <button
                className="logout-btn"
                onClick={logout}
              >
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