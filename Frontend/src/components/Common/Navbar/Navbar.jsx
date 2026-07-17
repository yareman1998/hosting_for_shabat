import { NavLink } from 'react-router-dom';
import { HomeIcon, FindHostIcon, MyRequestsIcon, RequestsBoardIcon, ProfileIcon, ShieldIcon, BellIcon } from '../Icons';
import './Navbar.css';

export default function Navbar({ userRole }) {
  
  // 1. Array containing link data, paths, labels, and icons
  const linksConfig = [
    {
      path: '/',
      label: 'בית',
      roles: ['guest', 'host'],
      icon: <HomeIcon className="nav-icon" />
    },
    {
      path: '/find-host',
      label: 'מצא מארח',
      roles: ['guest'],
      icon: <FindHostIcon className="nav-icon" />
    },
    {
      path: '/my-requests',
      label: 'הבקשות שלי',
      roles: ['guest'],
      hasBadge: true, // Special flag for the orange notification counter
      icon: <MyRequestsIcon className="nav-icon" />
    },
    {
      path: '/requests-board',
      label: 'לוח בקשות',
      roles: ['host'],
      icon: <RequestsBoardIcon className="nav-icon" />
    },
    {
      path: '/profile',
      label: 'פרופיל',
      roles: ['guest', 'host'],
      icon: <ProfileIcon className="nav-icon" />
    }
  ];

  // 2. Filter links instantly based on what role is passed into the header
  const allowedLinks = linksConfig.filter(link => link.roles.includes(userRole));

  // 3. Clean mapping function
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
      {/* BRANDING/LOGO */}
      <div className="navbar-right">
        <div className="logo-icon-container">
          <ShieldIcon size={32} className="shield-icon" />
        </div>
        <div className="logo-text">
          <span className="logo-title">שבת שלום</span>
          <span className="logo-subtitle">אירוח חיילים</span>
        </div>
      </div>

      {/* DYNAMIC LIST LINKS */}
      <ul className="navbar-links">
        {roots()}
      </ul>

      {/* NOTIFICATIONS & USER AVATAR */}
      <div className="navbar-left">
        <div className="notification-bell">
          <BellIcon className="" />
          <span className="bell-badge"></span>
        </div>
        <div className="profile-circle">ע</div>
      </div>
    </nav>
  );
}

