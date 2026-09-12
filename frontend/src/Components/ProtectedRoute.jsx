import { Navigate, useLocation } from "react-router-dom";
import { getStoredUser } from "../Services/authUtils";

function ProtectedRoute({ children, role, email }) {
  // TODO: Client-side role gating is cosmetic; relies on localStorage which can be spoofed.
  // Real authorization is enforced by the backend's authorizeRoles middleware.
  const user = getStoredUser();
  const location = useLocation();

  const targetPath = location.pathname + location.search;
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (!user) {
    const adminParam = isAdminRoute ? "&admin=true" : "";
    return (
      <Navigate 
        to={`/login?redirect=${encodeURIComponent(targetPath)}${adminParam}`} 
        state={{ redirectAfterLogin: targetPath }} 
        replace 
      />
    );
  }

  // `role` can be a single string ("candidate") or an array (["admin", "recruiter"])
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      // If a non-admin user (e.g. candidate) visits an admin route, send to login with admin autofill
      if (allowedRoles.includes("admin")) {
        return (
          <Navigate 
            to={`/login?redirect=${encodeURIComponent(targetPath)}&admin=true`} 
            state={{ redirectAfterLogin: targetPath }} 
            replace 
          />
        );
      }
      return <Navigate to="/" replace />;
    }
  }

  if (email && user.email?.toLowerCase() !== email.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;