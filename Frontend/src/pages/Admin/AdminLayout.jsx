import { NavLink, Outlet } from 'react-router-dom';
import { AdminIcon, UsersIcon, MyRequestsIcon, HomeIcon } from '../../components/Common/Icons';
import './Admin.css';

export default function AdminLayout() {
  return (
    <div className="admin-page">
      {/* Top Admin Sub-Navigation Tabs */}
      <div className="admin-nav-tabs">
        <NavLink to="/admin" end className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}>
          <AdminIcon />
          <span>לוח בקרה</span>
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}>
          <UsersIcon />
          <span>ניהול משתמשים</span>
        </NavLink>
        <NavLink to="/admin/listings" className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}>
          <HomeIcon />
          <span>דירות ומארחים</span>
        </NavLink>
        <NavLink to="/admin/bookings" className={({ isActive }) => `admin-tab-link ${isActive ? 'active' : ''}`}>
          <MyRequestsIcon />
          <span>בקשות</span>
        </NavLink>
      </div>

      {/* Render active sub-page content directly */}
      <div className="admin-content-area">
        <Outlet />
      </div>
    </div>
  );
}
