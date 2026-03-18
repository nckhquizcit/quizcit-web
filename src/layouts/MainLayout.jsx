import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import './MainLayout.css';

export default function MainLayout() {
  return (
    <div className="app-container">
      <Sidebar type="USER" />
      <main className="main-content">
        <div className="main-content__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
