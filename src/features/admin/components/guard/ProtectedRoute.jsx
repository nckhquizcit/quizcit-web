import { Navigate, useLocation } from "react-router-dom";

/**
 * Mock function để lấy thông tin user.
 * Trong thực tế, bạn sẽ lấy từ Redux, Zustand hoặc Context API.
 */
const getCurrentUser = () => {
  const userJson = localStorage.getItem("user");
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};

export default function ProtectedRoute({ children, roles = [] }) {
  const user = getCurrentUser();
  const location = useLocation();

  // 1. Kiểm tra đăng nhập
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Kiểm tra quyền truy cập (Role-based Access Control)
  // Nếu component yêu cầu các role cụ thể (ví dụ: ['ADMIN'])
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
