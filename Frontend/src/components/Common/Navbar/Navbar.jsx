import { NavLink } from 'react-router-dom';
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
import { Logo } from '../Icons';
import './Navbar.css';

export default function Navbar({ userRole }) {
  // 1. Array containing link data, paths, labels, and icons
  const linksConfig = [
    {
      path: '/',
      label: 'בית',
      roles: ['guest', 'host'],
      icon: <House className="w-4 h-4 nav-icon" />
    },
    {
      path: '/find-host',
      label: 'מצא מארח',
      roles: ['guest'],
      icon: <Search className="w-4 h-4 nav-icon" />
    },
    {
      path: '/my-requests',
      label: 'הבקשות שלי',
      roles: ['guest'],
      hasBadge: true,
      icon: <FileText className="w-4 h-4 nav-icon" />
    },
    {
      path: '/requests-board',
      label: 'לוח בקשות',
      roles: ['host'],
      icon: <ClipboardList className="w-4 h-4 nav-icon" />
    },
    {
      path: '/admin',
      end: true,
      label: 'לוח בקרה',
      roles: ['admin'],
      icon: <LayoutDashboard className="w-4 h-4 nav-icon" />
    },
    {
      path: '/admin/users',
      label: 'ניהול משתמשים',
      roles: ['admin'],
      icon: <Users className="w-4 h-4 nav-icon" />
    },
    {
      path: '/admin/listings',
      label: 'דירות ומארחים',
      roles: ['admin'],
      icon: <Building className="w-4 h-4 nav-icon" />
    },
    {
      path: '/admin/bookings',
      label: 'בקשות',
      roles: ['admin'],
      icon: <Inbox className="w-4 h-4 nav-icon" />
    },
    {
      path: '/profile',
      label: 'פרופיל',
      roles: ['guest', 'host'],
      icon: <User className="w-4 h-4 nav-icon" />
    }
  ];

  // 2. Filter links instantly based on what role is passed into the header
  const allowedLinks = linksConfig.filter(link => link.roles.includes(userRole));

  // 3. Clean mapping function with exact active / non-active button classes
  function roots() {
    return allowedLinks.map((link) => (
      <li key={link.path}>
        <NavLink
          to={link.path}
          end={link.end}
          className={({ isActive }) =>
            isActive
              ? "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all relative bg-secondary text-primary nav-item active"
              : "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all relative text-muted-foreground hover:text-foreground hover:bg-secondary/50 nav-item"
          }
        >
          {link.icon}
          <span>{link.label}</span>
          {link.hasBadge && <span className="requests-badge">1</span>}
        </NavLink>
      </li>
    ));
  }

  // Generate initials for avatar circle based on full_name or email in local storage
  const getInitials = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj?.full_name) {
          return userObj.full_name.trim().charAt(0);
        }
        if (userObj?.email) {
          return userObj.email.trim().charAt(0).toUpperCase();
        }
      }
    } catch (e) {
      // Fallback cleanly
    }
    return 'מ'; // מ - עבור משתמש כברירת מחדל
  };

  return (
    <nav className="navbar">
      {/* BRANDING/LOGO */}
      <div className="navbar-right">
        <div className="logo-icon-container">
          <Logo size={32} className="logo-icon" />
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
          <Bell className="w-5 h-5" />
          <span className="bell-badge"></span>
        </div>
        <div className="profile-circle">{getInitials()}</div>
      </div>
    </nav>
  );
}
