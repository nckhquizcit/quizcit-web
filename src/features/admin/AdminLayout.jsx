import { Outlet } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar type="ADMIN" />

      <div className="admin-main">
        <AdminNavbar />

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
