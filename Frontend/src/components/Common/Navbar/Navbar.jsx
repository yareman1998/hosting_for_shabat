import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  House,
  Search,
  FileText,
  ClipboardList,
  LayoutDashboard,
  Users,
  Building,
  Inbox,
  User,
  Bell
} from 'lucide-react';
import { authApi } from '../../../api/api';
import { Logo, LogOutIcon } from '../Icons';
import './Navbar.css';

export default function Navbar({ userRole }) {
  const navigate = useNavigate();
  
  // States & Selectors
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [userName, setUserName] = useState('');
  const dropdownRef = useRef(null);

  const badgeCount = useSelector((state) => state.requests.badgeCount);

  const linksConfig = [
    { path: '/', label: 'בית', roles: ['guest', 'host'], icon: <House className="nav-icon" /> },
    { path: '/find-host', label: 'מצא מארח', roles: ['guest'], icon: <Search className="nav-icon" /> },
    { path: '/my-requests', label: 'הבקשות שלי', roles: ['guest'], hasBadge: true, icon: <FileText className="nav-icon" /> },
    { path: '/requests-board', label: 'לוח בקשות', roles: ['host'], icon: <ClipboardList className="nav-icon" /> },
    { path: '/admin', end: true, label: 'לוח בקרה', roles: ['admin'], icon: <LayoutDashboard className="nav-icon" /> },
    { path: '/admin/users', label: 'ניהול משתמשים', roles: ['admin'], icon: <Users className="nav-icon" /> },
    { path: '/admin/listings', label: 'דירות ומארחים', roles: ['admin'], icon: <Building className="nav-icon" /> },
    { path: '/admin/bookings', label: 'בקשות', roles: ['admin'], icon: <Inbox className="nav-icon" /> },
    { path: '/profile', label: 'פרופיל', roles: ['guest', 'host'], icon: <User className="nav-icon" /> }
  ];

  const allowedLinks = linksConfig.filter(link => link.roles.includes(userRole));

  function roots() {
    return allowedLinks.map((link) => (
      <li key={link.path}>
        <NavLink
          to={link.path}
          end={link.end}
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          {link.icon}
          <span>{link.label}</span>
          {link.hasBadge && <span className="requests-badge">{badgeCount}</span>}
        </NavLink>
      </li>
    ));
  }

  useEffect(() => {
    const fetchUserForNav = async () => {
      if (!localStorage.getItem('token')) return;

      try {
        const response = await authApi.getMe();
        setUserName(response.data.full_name);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error("Navbar failed to fetch user:", error);
      }
    };

    fetchUserForNav();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    authApi.logout(); 
    navigate('/login');
  };

  const getInitials = () => {
    if (userName) return userName.trim().charAt(0);
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj?.full_name) return userObj.full_name.trim().charAt(0);
        if (userObj?.email) return userObj.email.trim().charAt(0).toUpperCase();
      }
    } catch (e) {}
    return 'מ';
  };

  const firstName = userName ? userName.split(' ')[0] : '';

  return (
    <nav className="navbar">
      <div className="navbar-right">
        <div className="logo-icon-container">
          <Logo size={32} className="logo-icon" />
        </div>
        <div className="logo-text">
          <span className="logo-title">שבת שלום</span>
          <span className="logo-subtitle">אירוח חיילים</span>
        </div>
      </div>

      <ul className="navbar-links">
        {roots()}
      </ul>

      <div className="navbar-left">
        <div className="notification-bell">
          <Bell className="nav-icon" />
          <span className="bell-badge"></span>
        </div>
        
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <div 
            className="profile-circle" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {getInitials()}
          </div>

          {isDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-large-initial">{getInitials()}</div>
                <span>שלום {firstName}!</span>
              </div>
              
              <div className="dropdown-divider"></div>

              <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}>
                <User className="dropdown-icon" /> הפרופיל שלי
              </button>

              <button className="dropdown-item" onClick={() => setIsDark(!isDark)}>
                {isDark ? '☀️' : '🌙'}
                <span style={{ marginRight: '8px' }}>
                  {isDark ? 'מצב בהיר' : 'מצב כהה'}
                </span>
              </button>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <LogOutIcon className="dropdown-icon" />
                התנתקות
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}