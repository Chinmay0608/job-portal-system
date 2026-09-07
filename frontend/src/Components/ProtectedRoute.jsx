import { Navigate } from "react-router-dom";
import { getStoredUser } from "../Services/authUtils";

function ProtectedRoute({ children, role, email }) {
  // TODO: Client-side role gating is cosmetic; relies on localStorage which can be spoofed.
  // Real authorization is enforced by the backend's authorizeRoles middleware.
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // `role` can be a single string ("candidate") or an array (["admin", "recruiter"])
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  if (email && user.email?.toLowerCase() !== email.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;