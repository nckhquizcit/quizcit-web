import { useEffect, useState } from "react";
import "../Admin.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, Menu, User } from "lucide-react";
import { enterUserPreview } from "../../../services/userPreviewMode";
import { getStoredUser, setStoredUser, subscribeToAuthChange } from "../../../services/apiClient";
import { getCurrentUser } from "../../../services/userService";
import { resolveImageUrl } from "../../../services/mappers";

export default function AdminNavbar({ onOpenMenu, mobileOpen = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => subscribeToAuthChange(() => {
    setUser(getStoredUser());
    setAvatarError(false);
  }), []);

  useEffect(() => {
    getCurrentUser()
      .then((freshUser) => {
        if (freshUser) {
          const stored = getStoredUser() || {};
          setStoredUser({ ...stored, ...freshUser });
        }
      })
      .catch(() => {});
  }, []);

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
        <Link to="/admin/profile" className="profile-btn" title="Trang hồ sơ quản trị">
          {user?.avatarUrl && !avatarError ? (
            <img
              src={resolveImageUrl(user.avatarUrl)}
              alt=""
              className="admin-profile-btn__avatar-img"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <User size={16} strokeWidth={2} />
          )}
          <span>{user?.displayName || user?.username || "Hồ sơ"}</span>
        </Link>
      </div>
    </div>
  );
}
