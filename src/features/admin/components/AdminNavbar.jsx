import "../Admin.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, Menu, User } from "lucide-react";
import { enterUserPreview } from "../../../services/userPreviewMode";

export default function AdminNavbar({ onOpenMenu }) {
  const location = useLocation();
  const navigate = useNavigate();

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
        >
          <Menu size={22} />
        </button>
        <h3 className="navbar-title">Quản trị hệ thống</h3>
      </div>

      <div className="admin-user">
        <button type="button" className="preview-user-btn" onClick={handleEnterUserPreview}>
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
