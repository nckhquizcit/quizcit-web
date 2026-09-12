import { Navigate, Outlet } from "react-router-dom";
import { getStoredUser } from "../services/apiClient";
import "./AuthLayout.css";

export default function AuthLayout() {
  // Da dang nhap thi khong hien lai form auth nua (cung cach kiem tra nhu ProtectedRoute).
  const user = getStoredUser();
  const token = localStorage.getItem("accessToken");

  if (token && user) {
    return <Navigate to={user.role === "ADMINISTRATOR" ? "/admin" : "/app"} replace />;
  }

  return (
    <div className="auth-external-wrapper">
      {/* Outlet sẽ render toàn bộ RegisterPage/LoginPage (bao gồm cả Card và Form) */}
      <Outlet />
    </div>
  );
}
