import { useState } from "react";
import AdminSidebar from "./components/AdminSidebar";
import AdminNavbar from "./components/AdminNavbar";
import "./Admin.css";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <AdminSidebar />

      <div className="admin-main">
        <AdminNavbar toggleSidebar={() => setCollapsed(!collapsed)} />

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
