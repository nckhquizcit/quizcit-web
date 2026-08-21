import { useEffect, useRef, useState } from "react";
import { LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { ADMIN_SIDEBAR, USER_SIDEBAR } from "../../constants/menuConfig";
import { logout } from "../../services/authService";
import { getStoredUser } from "../../services/apiClient";
import { resolveImageUrl } from "../../services/mappers";
import "./Sidebar.css";

function getInitials(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Sidebar({ type = "USER", mobileOpen = false, onClose, user: userProp = null }) {
  const isAdmin = type === "ADMIN";
  const sidebarItems = isAdmin ? ADMIN_SIDEBAR : USER_SIDEBAR;
  const [isMinimized, setIsMinimized] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navigate = useNavigate();
  const accountRef = useRef(null);
  const user = userProp ?? getStoredUser();

  const displayName =
    user?.displayName || user?.username || (isAdmin ? "Quản trị viên" : "Học viên");
  const roleLabel = isAdmin ? "Administrator" : "Học viên";
  const sectionLabel = isAdmin ? "QUẢN TRỊ" : "KHÔNG GIAN HỌC";
  const brandSubtitle = isAdmin ? "ADMIN CONSOLE" : "Ôn tập trực tuyến";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobile = () => {
    if (onClose) onClose();
  };

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeIfOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const variant = isAdmin ? "sidebar-wrapper--admin" : "sidebar-wrapper--user";

  return (
    <aside
      id={isAdmin ? "admin-sidebar" : undefined}
      className={`sidebar-wrapper ${variant} ${isMinimized ? "minimized" : ""} ${
        mobileOpen ? "is-mobile-open" : ""
      }`}
    >
      {isMinimized && (
        <button
          type="button"
          className="open-sidebar-container"
          onClick={() => setIsMinimized(false)}
          title="Mở rộng"
          aria-label="Mở thanh điều hướng"
        >
          <PanelLeftOpen size={28} className="open-sidebar-icon" />
        </button>
      )}

      <div className="sidebar-content">
        <div className="sidebar-title">
          <div className="sidebar-brand">
            <span className="sidebar-brand__mark">Q</span>
            <div className="title-text">
              <h2>QuizCIT</h2>
              <p>{brandSubtitle}</p>
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

        <p className="sidebar-section-label">{sectionLabel}</p>

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

        <div className="sidebar-footer">
          <div className="sidebar-user" ref={accountRef}>
            <span className="sidebar-user__avatar">
              {user?.avatarUrl ? (
                <img src={resolveImageUrl(user.avatarUrl)} alt="" />
              ) : (
                getInitials(displayName)
              )}
            </span>
            <div className="sidebar-user__info">
              <p className="sidebar-user__name">{displayName}</p>
              <p className="sidebar-user__role">{roleLabel}</p>
            </div>
            <button
              type="button"
              className="sidebar-user__more"
              onClick={() => setAccountMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              aria-label="Tùy chọn tài khoản"
            >
              <MoreHorizontal size={18} />
            </button>

            {accountMenuOpen && (
              <div className="sidebar-user__menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="sidebar-user__menu-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
