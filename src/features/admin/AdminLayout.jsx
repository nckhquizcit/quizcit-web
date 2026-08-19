import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import { ToastProvider } from "../../components/ui/Toast/Toast";
import { getStoredUser } from "../../services/apiClient";
import { clearUserPreview, isUserPreviewActive } from "../../services/userPreviewMode";
import "./Admin.css";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="admin-main">
          <AdminNavbar
            mobileOpen={mobileOpen}
            onOpenMenu={() => setMobileOpen(true)}
          />

          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
