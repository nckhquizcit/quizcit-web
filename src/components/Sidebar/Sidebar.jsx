import { BookOpen, House, User, X, History } from "lucide-react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";

const sidebarItems = [
  { id: "home", label: "Trang chủ", path: "/", icon: <House></House> },
  {
    id: "subject",
    label: "Môn học",
    path: "/subjects",
    icon: <BookOpen></BookOpen>,
  },
  {
    id: "history",
    label: "Lịch sử",
    path: "/history",
    icon: <History></History>,
  },
  { id: "profile", label: "Cá nhân", path: "/profile", icon: <User></User> },
];

export default function Sidebar() {
  return (
    <div className="sidebar-container">
      <div className="sidebar-title">
        <div>
          <h2>QuizCIT</h2>
          <p>Hệ thống ôn tập trắc nghiệm trực tuyến thông minh</p>
        </div>
        <X size="32" className="sidebar-close-icon"></X>
      </div>

      <nav className="sidebar-menu">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-item active" : "sidebar-item"
            }
          >
            {item.icon}
            <p>{item.label}</p>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
