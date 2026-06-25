import { Navigate, useLocation } from "react-router-dom";
import { getStoredUser } from "../../../../services/apiClient";

export default function ProtectedRoute({ children, roles = [] }) {
  const location = useLocation();
  const user = getStoredUser();
  const token = localStorage.getItem("accessToken");

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
