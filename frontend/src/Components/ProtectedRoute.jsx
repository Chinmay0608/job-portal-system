import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  /* Not Logged In */
  if (!user) return <Navigate to="/login" />;

  /* Wrong Role */
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
}

export default ProtectedRoute;