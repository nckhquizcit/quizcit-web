import { X, PanelLeftOpen } from "lucide-react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { USER_SIDEBAR, ADMIN_SIDEBAR } from "../../constants/menuConfig";
export default function Sidebar({ type = "USER" }) {
  const sidebarItems = type === "ADMIN" ? ADMIN_SIDEBAR : USER_SIDEBAR;
  const [closeSidebar, setCloseSidebar] = useState(false);
  const handleOnClose = () => {
    setCloseSidebar(true);
  };
  const handleOnOpen = () => {
    setCloseSidebar(false);
  };
  return (
    <>
      <div className={`sidebar-container ${closeSidebar && "minimized"}`}>
        <div className="sidebar-title">
          <div>
            <h2>{type === "USER" ? "QuizCIT" : "QuizCIT Admin"}</h2>
            <p>
              {type === "USER"
                ? "Hệ thống ôn tập trắc nghiệm trực tuyến thông minh"
                : "Trang quản lý cho quản trị viên"}
            </p>
          </div>
          <X
            size="32"
            className="sidebar-close-icon"
            onClick={handleOnClose}
          ></X>
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

      <PanelLeftOpen
        size="32"
        className={`open-sidebar-icon ${!closeSidebar && "disabled"}`}
        onClick={handleOnOpen}
      ></PanelLeftOpen>
    </>
  );
}
