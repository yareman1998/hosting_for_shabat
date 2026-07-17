import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ userRole }) => {
  return (
    <nav className="navbar">
      {/* 1. NOW FIRST (Renders on the FAR RIGHT in RTL): App Logo */}
      <div className="navbar-right">
        <div className="logo-icon-container">
          {/* Blue Shield Icon */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#1d4ed8" className="shield-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="logo-text">
          <span className="logo-title">שבת שלום</span>
          <span className="logo-subtitle">אירוח חיילים</span>
        </div>
      </div>

      {/* 2. CENTER: Navigation Links */}
      <ul className="navbar-links">
        {/* Always visible: Home */}
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>בית</span>
          </NavLink>
        </li>

        {/* Guest Links */}
        {userRole === 'guest' && (
          <>
            <li>
              <NavLink to="/find-host" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>מצא מארח</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/my-requests" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <div className="nav-item-badge-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span>הבקשות שלי</span>
                  <span className="requests-badge">1</span>
                </div>
              </NavLink>
            </li>
          </>
        )}

        {/* Host Links */}
        {userRole === 'host' && (
          <li>
            <NavLink to="/requests-board" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="13" x2="15" y2="13"></line>
                <line x1="9" y1="17" x2="15" y2="17"></line>
              </svg>
              <span>לוח בקשות</span>
            </NavLink>
          </li>
        )}

        {/* Always visible: Profile Link */}
        <li>
          <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>פרופיל</span>
          </NavLink>
        </li>
      </ul>

      {/* 3. NOW LAST (Renders on the FAR LEFT in RTL): Notifications & Profile Avatar */}
      <div className="navbar-left">
        <div className="notification-bell">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="bell-badge"></span>
        </div>

        <div className="profile-circle">ע</div> {/* 'ע' for Omri */}
      </div>
    </nav>
  );
};

export default Navbar;