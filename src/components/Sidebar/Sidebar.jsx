import { useState } from "react";
import { NavLink } from "react-router-dom";
import { PanelLeftOpen, X } from "lucide-react";

import { ADMIN_SIDEBAR, USER_SIDEBAR } from "../../constants/menuConfig";
import "./Sidebar.css";

export default function Sidebar({ type = "USER" }) {
  const sidebarItems = type === "ADMIN" ? ADMIN_SIDEBAR : USER_SIDEBAR;
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <aside className={`sidebar-wrapper ${isMinimized ? "minimized" : ""}`}>
      {isMinimized && (
        <div className="open-sidebar-container">
          <PanelLeftOpen
            size="32"
            className="open-sidebar-icon"
            onClick={() => setIsMinimized(false)}
          />
        </div>
      )}

      <div className={`sidebar-content ${isMinimized ? "hidden" : ""}`}>
        <div className="sidebar-title">
          <div className="title-text">
            <h2>QuizCIT</h2>
            <p>{type === "USER" ? "Ôn tập trực tuyến" : "Quản trị viên"}</p>
          </div>
          <X
            size="32"
            className="sidebar-close-icon"
            onClick={() => setIsMinimized(true)}
          />
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
    </aside>
  );
}
