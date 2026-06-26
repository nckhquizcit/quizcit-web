import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import { ToastProvider } from "../../components/ui/Toast/Toast";
import "./Admin.css";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <AdminNavbar onOpenMenu={() => setMobileOpen(true)} />

          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
