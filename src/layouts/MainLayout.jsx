import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar/Sidebar";
import { ToastProvider } from "../components/ui/Toast/Toast";
import { getStoredUser } from "../services/apiClient";
import "./MainLayout.css";

const TITLE_MAP = [
  { match: (p) => p === "/app", title: "Trang chủ" },
  { match: (p) => p.startsWith("/app/subjects"), title: "Môn học" },
  { match: (p) => p.startsWith("/app/quiz/result"), title: "Kết quả" },
  { match: (p) => p.startsWith("/app/quiz"), title: "Làm bài" },
  { match: (p) => p.startsWith("/app/history"), title: "Lịch sử" },
  { match: (p) => p.startsWith("/app/progress"), title: "Tiến độ" },
  { match: (p) => p.startsWith("/app/profile"), title: "Cá nhân" },
];

function resolveTitle(pathname) {
  const found = TITLE_MAP.find((t) => t.match(pathname));
  return found ? found.title : "QuizCIT";
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();

  const displayName = user?.displayName || user?.username || "Học viên";
  const initial = displayName.trim().charAt(0).toUpperCase() || "H";

  return (
    <ToastProvider>
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
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="app-main-col">
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
              <h1 className="app-topbar__title">
                {resolveTitle(location.pathname)}
              </h1>
            </div>

            <button
              type="button"
              className="app-topbar__user"
              onClick={() => navigate("/app/profile")}
              title="Trang cá nhân"
            >
              <span className="app-topbar__avatar">{initial}</span>
              <span className="app-topbar__name">{displayName}</span>
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
