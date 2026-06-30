import "../Admin.css";
import { Link } from "react-router-dom";
import { Menu, User } from "lucide-react";

export default function AdminNavbar({ onOpenMenu }) {
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
      </div>
    </div>
  );
}
