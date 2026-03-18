import { Outlet } from "react-router-dom";
import "./AuthLayout.css";

export default function AuthLayout() {
  return (
    <div className="auth-external-wrapper">
      {/* Outlet sẽ render toàn bộ RegisterPage/LoginPage (bao gồm cả Card và Form) */}
      <Outlet />
    </div>
  );
}
