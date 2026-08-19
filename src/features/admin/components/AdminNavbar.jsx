import "../Admin.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, Menu, User } from "lucide-react";
import { enterUserPreview } from "../../../services/userPreviewMode";
import { getStoredUser } from "../../../services/apiClient";

export default function AdminNavbar({ onOpenMenu, mobileOpen = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const userLabel =
    user?.displayName || user?.username || user?.email || "Quản trị viên";

  const handleEnterUserPreview = () => {
    enterUserPreview(`${location.pathname}${location.search}${location.hash}`);
    navigate("/app");
  };

  return (
    <div className="admin-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-menu-btn"
          onClick={onOpenMenu}
          aria-label="Mở menu"
          aria-expanded={mobileOpen}
          aria-controls="admin-sidebar"
        >
          <Menu size={22} />
        </button>
        <div className="adm2-navbar-titleblock">
          <span className="adm2-navbar-eyebrow">Quản trị</span>
          <h3 className="adm2-navbar-title">QuizCIT Admin</h3>
          <span className="adm2-navbar-user">{userLabel}</span>
        </div>
      </div>

      <div className="admin-user">
        <button
          type="button"
          className="preview-user-btn"
          onClick={handleEnterUserPreview}
          aria-label="Xem như người dùng"
        >
          <Eye size={16} strokeWidth={2} />
          <span>Xem như người dùng</span>
        </button>
        <Link to="/admin/profile" className="profile-btn">
          <User size={16} strokeWidth={2} />
          <span>Hồ sơ</span>
        </Link>
      </div>
    </div>
  );
}
