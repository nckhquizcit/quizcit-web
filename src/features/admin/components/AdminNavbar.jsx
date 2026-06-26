import "../Admin.css";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, User } from "lucide-react";
import { logout } from "../../../services/authService";

export default function AdminNavbar({ onOpenMenu }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <Link to="/admin/profile" className="profile-btn">
          <User size={16} strokeWidth={2} />
          <span>Hồ sơ</span>
        </Link>

        <button type="button" className="logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
