import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

function Navbar() {

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
    <nav className="custom-navbar">

      {/* Logo */}

      <Link
        className="navbar-brand"
        to="/"
      >
        SkillBridge
      </Link>

      {/* Right Side Buttons */}

      <div className="nav-buttons">

        {isHome ? (

          <>
            <Link
              className="login-btn"
              to="/login"
            >
              Log In
            </Link>

            <Link
              className="signup-btn"
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
              <Link
                className="dashboard-btn"
                to="/recruiter-dashboard"
              >
                Dashboard
              </Link>
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