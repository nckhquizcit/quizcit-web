import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import { ToastProvider } from "../../components/ui/Toast/Toast";
import ErrorBoundary from "../../components/ui/ErrorBoundary/ErrorBoundary";
import RouteErrorFallback from "../../components/ui/ErrorBoundary/RouteErrorFallback";
import { getStoredUser, subscribeToAuthChange } from "../../services/apiClient";
import { clearUserPreview, isUserPreviewActive } from "../../services/userPreviewMode";
import "./Admin.css";

const renderRouteFallback = ({ reload }) => <RouteErrorFallback reload={reload} />;

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(() => getStoredUser());
  const location = useLocation();

  useEffect(() => subscribeToAuthChange(() => setUser(getStoredUser())), []);

  useEffect(() => {
    if (isUserPreviewActive(getStoredUser())) clearUserPreview();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <ToastProvider>
      <div className="admin-layout">
        {mobileOpen && (
          <div
            className="admin-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          type="ADMIN"
          user={user}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="admin-main">
          <AdminNavbar
            mobileOpen={mobileOpen}
            onOpenMenu={() => setMobileOpen(true)}
          />

          <div className="admin-content">
            {/* key theo pathname: bam sang trang khac la tu thoat man hinh loi */}
            <ErrorBoundary key={location.pathname} renderFallback={renderRouteFallback}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
