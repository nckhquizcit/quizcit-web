import AdminNavbar from "./components/AdminNavbar";
import "./Admin.css";
import Sidebar from "../../components/Sidebar/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar type="ADMIN"></Sidebar>

      <div className="admin-main">
        <AdminNavbar />

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
