import "../Admin.css";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";

export default function AdminNavbar() {
  return (
    <div className="admin-navbar">
      <div className="navbar-left">
        <h3 className="navbar-title">Quản trị hệ thống</h3>
      </div>

      <div className="admin-user">
        <div className="admin-info">
          <span className="admin-label">Quản trị viên</span>
          <span className="role">Quản trị viên</span>
        </div>

        <Link to="/admin/profile" className="profile-btn">
          <User size={16} strokeWidth={2} />
          <span>Hồ sơ</span>
        </Link>

        <button className="logout">
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
