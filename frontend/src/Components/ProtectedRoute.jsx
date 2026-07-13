import { Navigate } from "react-router-dom";
import { getStoredUser, isTokenExpired, logoutUser } from "../Services/authUtils";

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user || isTokenExpired(token)) {
    logoutUser();
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;