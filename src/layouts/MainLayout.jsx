import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import "./MainLayout.css";

export default function MainLayout() {
  return (
    <div className="app-container">
      <Sidebar type="USER"></Sidebar>
      <div className="main-content">
        <Outlet></Outlet>
      </div>
    </div>
  );
}
