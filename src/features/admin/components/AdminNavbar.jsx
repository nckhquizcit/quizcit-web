import "../Admin.css";

export default function AdminNavbar() {
  return (
    <div className="admin-navbar">
      <div className="navbar-left">
        <h3 className="navbar-title">Quản trị hệ thống</h3>
      </div>

      <div className="admin-user">
        <span className="admin-label">Quản trị viên</span>

        <span className="role">ADMINISTRATOR</span>

        <button className="logout">Đăng xuất</button>
      </div>
    </div>
  );
}
