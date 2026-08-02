import { useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { ADMIN_SIDEBAR, USER_SIDEBAR } from "../../constants/menuConfig";
import { logout } from "../../services/authService";
import "./Sidebar.css";

export default function Sidebar({ type = "USER", mobileOpen = false, onClose }) {
  const sidebarItems = type === "ADMIN" ? ADMIN_SIDEBAR : USER_SIDEBAR;
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobile = () => {
    if (onClose) onClose();
  };

  const variant = type === "ADMIN" ? "sidebar-wrapper--admin" : "sidebar-wrapper--user";

  return (
    <aside
      className={`sidebar-wrapper ${variant} ${isMinimized ? "minimized" : ""} ${
        mobileOpen ? "is-mobile-open" : ""
      }`}
    >
      {isMinimized && (
        <div className="open-sidebar-container">
          <PanelLeftOpen
            size="28"
            className="open-sidebar-icon"
            onClick={() => setIsMinimized(false)}
          />
        </div>
      )}

      <div className={`sidebar-content ${isMinimized ? "hidden" : ""}`}>
        <div className="sidebar-title">
          <div className="sidebar-brand">
            <span className="sidebar-brand__mark">Q</span>
            <div className="title-text">
              <h2>QuizCIT</h2>
              <p>{type === "USER" ? "Ôn tập trực tuyến" : "Quản trị viên"}</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsMinimized(true)}
            title="Thu gọn"
            aria-label="Thu gọn thanh điều hướng"
          >
            <PanelLeftClose size={20} />
          </button>
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={closeMobile}
            aria-label="Đóng menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.end}
              onClick={closeMobile}
              className={({ isActive }) =>
                isActive ? "sidebar-item active" : "sidebar-item"
              }
            >
              <span className="sidebar-item__icon">{item.icon}</span>
              <p>{item.label}</p>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          title="Đăng xuất"
        >
          <LogOut size={20} />
          <p>Đăng xuất</p>
        </button>
      </div>
    </aside>
  );
}
