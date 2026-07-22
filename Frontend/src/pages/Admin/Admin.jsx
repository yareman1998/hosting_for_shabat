import { Outlet } from 'react-router-dom';
import './Admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-page">
      {/* Render active sub-page content directly */}
      <div className="admin-content-area">
        <Outlet />
      </div>
    </div>
  );
}
