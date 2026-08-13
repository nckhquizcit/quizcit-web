import { useEffect, useState } from "react";
import { Link, Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import Sidebar from "../components/Sidebar/Sidebar";
import { ToastProvider } from "../components/ui/Toast/Toast";
import { getStoredUser, subscribeToAuthChange } from "../services/apiClient";
import {
  exitUserPreview,
  isUserPreviewActive,
  subscribeToUserPreview,
} from "../services/userPreviewMode";
import "./MainLayout.css";

const TITLE_MAP = [
  { match: (p) => p === "/app", title: "Trang chủ" },
  { match: (p) => p.startsWith("/app/subjects"), title: "Môn học" },
  { match: (p) => p.startsWith("/app/quiz/result"), title: "Kết quả" },
  { match: (p) => p.startsWith("/app/quiz"), title: "Làm bài" },
  { match: (p) => p.startsWith("/app/adaptive"), title: "Bài kiểm tra thích ứng" },
  { match: (p) => p.startsWith("/app/history"), title: "Lịch sử" },
  { match: (p) => /^\/app\/progress\/skills\/.+/.test(p), title: "Chi tiết kỹ năng" },
  { match: (p) => p.startsWith("/app/progress/skills"), title: "Tất cả kỹ năng" },
  { match: (p) => p.startsWith("/app/progress"), title: "Tiến độ" },
  { match: (p) => p.startsWith("/app/profile"), title: "Cá nhân" },
];

function resolveTitle(pathname) {
  const found = TITLE_MAP.find((t) => t.match(pathname));
  return found ? found.title : "QuizCIT";
}


function getFirstName(displayName) {
  const trimmed = (displayName || "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1];
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [isPreviewing, setIsPreviewing] = useState(() => isUserPreviewActive(user));

  useEffect(() => subscribeToAuthChange(() => setUser(getStoredUser())), []);

  useEffect(
    () => subscribeToUserPreview(() => setIsPreviewing(isUserPreviewActive(getStoredUser()))),
    [],
  );

  const handleExitPreview = () => {
    navigate(exitUserPreview());
  };

  const displayName = user?.displayName || user?.username || "Học viên";
  const initial = displayName.trim().charAt(0).toUpperCase() || "H";
  const firstName = getFirstName(displayName) || displayName;

  return (
    <ToastProvider>
      {/* Điều hướng sang trang con phải bắt đầu từ đầu trang, không giữ vị trí cuộn cũ. */}
      <ScrollRestoration />
      <div className="app-container">
        {mobileOpen && (
          <div
            className="app-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          type="USER"
          user={user}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className={`app-main-col ${isPreviewing ? "app-main-col--preview" : ""}`}>
          {isPreviewing && (
            <div className="user-preview-banner" role="status">
              <span>Bạn đang xem website với góc nhìn của người dùng.</span>
              <button type="button" onClick={handleExitPreview}>
                <ArrowLeft size={16} />
                Quay lại trang quản trị
              </button>
            </div>
          )}
          <header className="app-topbar">
            <div className="app-topbar__left">
              <button
                type="button"
                className="app-topbar__menu"
                onClick={() => setMobileOpen(true)}
                aria-label="Mở menu"
              >
                <Menu size={22} />
              </button>
              <div className="app-topbar__titles">
                {/* Breadcrumb thật: gốc là link về /app, đoạn trang hiện tại là chữ thường. */}
                <nav className="app-topbar__breadcrumb" aria-label="Đường dẫn">
                  <Link to="/app" className="app-topbar__breadcrumb-link">
                    Không gian học
                  </Link>
                  {location.pathname !== "/app" && (
                    <span> / {resolveTitle(location.pathname)}</span>
                  )}
                </nav>
                {/* Không dùng h1 ở topbar: mỗi trang tự sở hữu h1 riêng. */}
                <p className="app-topbar__title">
                  {resolveTitle(location.pathname)}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="app-topbar__user"
              onClick={() => navigate("/app/profile")}
              title="Trang cá nhân"
            >
              <span className="app-topbar__avatar">{initial}</span>
              <span className="app-topbar__name">{firstName}</span>
            </button>
          </header>

          <main className="main-content">
            <div className="main-content__inner">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
