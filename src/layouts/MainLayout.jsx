import { useEffect, useState } from "react";
import { Link, Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import Sidebar from "../components/Sidebar/Sidebar";
import { ToastProvider, useToast } from "../components/ui/Toast/Toast";
import ErrorBoundary from "../components/ui/ErrorBoundary/ErrorBoundary";
import RouteErrorFallback from "../components/ui/ErrorBoundary/RouteErrorFallback";
import { getStoredUser, setStoredUser, subscribeToAuthChange } from "../services/apiClient";
import { getCurrentUser } from "../services/userService";
import { resolveImageUrl } from "../services/mappers";
import {
  exitUserPreview,
  isUserPreviewActive,
  subscribeToUserPreview,
} from "../services/userPreviewMode";
import { useQuizAutoSubmitSync } from "../features/quiz/hooks/useQuizAutoSubmitSync";
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

const EXAM_ROUTES_REGEX = /^\/app\/(quiz\/(?!result\/)[^/]+|adaptive\/[^/]+)$/;

const renderRouteFallback = ({ reload }) => <RouteErrorFallback reload={reload} />;

function resolveTitle(pathname) {
  const found = TITLE_MAP.find((t) => t.match(pathname));
  return found ? found.title : "QuizCIT";
}

function MainLayoutContent() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [avatarError, setAvatarError] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(() => isUserPreviewActive(user));
  const toast = useToast();

  const isExamMode = EXAM_ROUTES_REGEX.test(location.pathname);

  // Tự động kiểm tra và nộp các bài thi đã hết thời gian làm bài của user trong nền
  useQuizAutoSubmitSync(user, toast.show);

  useEffect(() => subscribeToAuthChange(() => {
    setUser(getStoredUser());
    setAvatarError(false);
  }), []);

  useEffect(() => {
    getCurrentUser()
      .then((freshUser) => {
        // Chi tron khi co ma dinh danh that. mapUser() luon tra ve object day du
        // (ke ca khi du lieu vao rong) voi role mac dinh la USER, nen chi kiem tra
        // "co object" se ghi de mat quyen quan tri khi may chu tra 200 than rong/HTML.
        if (freshUser?.userId) {
          const stored = getStoredUser() || {};
          setStoredUser({ ...stored, ...freshUser });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(
    () => subscribeToUserPreview(() => setIsPreviewing(isUserPreviewActive(getStoredUser()))),
    [],
  );

  const handleExitPreview = () => {
    navigate(exitUserPreview());
  };

  const displayName = user?.displayName || user?.username || "Sinh viên";
  const initial = displayName.trim().charAt(0).toUpperCase() || "S";

  return (
    <>
      {/* Điều hướng sang trang con phải bắt đầu từ đầu trang, không giữ vị trí cuộn cũ. */}
      <ScrollRestoration />
      <div className={`app-container ${isExamMode ? "app-container--exam" : ""}`}>
        {!isExamMode && mobileOpen && (
          <div
            className="app-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {!isExamMode && (
          <Sidebar
            type="USER"
            user={user}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />
        )}

        <div
          className={`app-main-col ${isExamMode ? "app-main-col--exam" : ""} ${
            isPreviewing && !isExamMode ? "app-main-col--preview" : ""
          }`}
        >
          {isPreviewing && !isExamMode && (
            <div className="user-preview-banner" role="status">
              <span>Bạn đang xem website với góc nhìn của người dùng.</span>
              <button type="button" onClick={handleExitPreview}>
                <ArrowLeft size={16} />
                Quay lại trang quản trị
              </button>
            </div>
          )}
          {!isExamMode && (
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
                aria-label={`Trang cá nhân của ${displayName}`}
              >
                <span className="app-topbar__avatar">
                  {user?.avatarUrl && !avatarError ? (
                    <img
                      src={resolveImageUrl(user.avatarUrl)}
                      alt=""
                      className="app-topbar__avatar-img"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    initial
                  )}
                </span>
                <span className="app-topbar__name">{displayName}</span>
              </button>
            </header>
          )}

          <main className="main-content">
            <div className="main-content__inner">
              {/* Boc Outlet de mot trang loi khong keo theo sidebar/topbar.
                  key theo pathname de bam sang trang khac la tu thoat man hinh loi. */}
              <ErrorBoundary key={location.pathname} renderFallback={renderRouteFallback}>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default function MainLayout() {
  return (
    <ToastProvider>
      <MainLayoutContent />
    </ToastProvider>
  );
}
