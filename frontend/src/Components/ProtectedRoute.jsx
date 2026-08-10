import { Navigate } from "react-router-dom";
import { getStoredUser } from "../Services/authUtils";

function ProtectedRoute({ children, role }) {
  // TODO: Client-side role gating is cosmetic; relies on localStorage which can be spoofed.
  // Real authorization is enforced by the backend's authorizeRoles middleware.
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;