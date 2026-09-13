import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredUser } from "../services/apiClient";
import ErrorBoundary from "../components/ui/ErrorBoundary/ErrorBoundary";
import RouteErrorFallback from "../components/ui/ErrorBoundary/RouteErrorFallback";
import "./AuthLayout.css";

const renderRouteFallback = ({ reload }) => <RouteErrorFallback reload={reload} />;

export default function AuthLayout() {
  const location = useLocation();
  // Da dang nhap thi khong hien lai form auth nua (cung cach kiem tra nhu ProtectedRoute).
  const user = getStoredUser();
  const token = localStorage.getItem("accessToken");

  if (token && user) {
    return <Navigate to={user.role === "ADMINISTRATOR" ? "/admin" : "/app"} replace />;
  }

  return (
    <div className="auth-external-wrapper">
      {/* Outlet sẽ render toàn bộ RegisterPage/LoginPage (bao gồm cả Card và Form) */}
      <ErrorBoundary key={location.pathname} renderFallback={renderRouteFallback}>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}
