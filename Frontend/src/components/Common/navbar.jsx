import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ userRole }) {
  
  // 1. Array array containing link data, paths, labels, and icons
  const linksConfig = [
    {
      path: '/',
      label: 'בית',
      roles: ['guest', 'host'],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      path: '/find-host',
      label: 'מצא מארח',
      roles: ['guest'],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    {
      path: '/my-requests',
      label: 'הבקשות שלי',
      roles: ['guest'],
      hasBadge: true, // Special flag for the orange notification counter
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      path: '/requests-board',
      label: 'לוח בקשות',
      roles: ['host'],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9"></line>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="15" y2="17"></line>
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'פרופיל',
      roles: ['guest', 'host'],
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    }
  ];

  // 2. Filter links instantly based on what role is passed into the header
  const allowedLinks = linksConfig.filter(link => link.roles.includes(userRole));

  // 3. Clean mapping function modeled precisely after your reference project pattern
  function roots() {
    return allowedLinks.map((link) => (
      <li key={link.path}>
        <NavLink 
          to={link.path} 
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          <div className={link.hasBadge ? "nav-item-badge-wrapper" : ""}>
            {link.icon}
            <span>{link.label}</span>
            {link.hasBadge && <span className="requests-badge">1</span>}
          </div>
        </NavLink>
      </li>
    ));
  }

  return (
    <nav className="navbar">
      {/* BRANDING/LOGO (Renders on far right due to RTL) */}
      <div className="navbar-right">
        <div className="logo-icon-container">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#1d4ed8" className="shield-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="logo-text">
          <span className="logo-title">שבת שלום</span>
          <span className="logo-subtitle">אירוח חיילים</span>
        </div>
      </div>

      {/* DYNAMIC LIST LINKS (Center container) */}
      <ul className="navbar-links">
        {roots()}
      </ul>

      {/* NOTIFICATIONS & USER AVATAR (Renders on far left due to RTL) */}
      <div className="navbar-left">
        <div className="notification-bell">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="bell-badge"></span>
        </div>
        <div className="profile-circle">ע</div>
      </div>
    </nav>
  );
}