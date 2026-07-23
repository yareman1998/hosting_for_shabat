import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Check } from 'lucide-react';
import './NotificationBell.css';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Mock notifications - Later you and David can fetch these from your FastAPI/PostgreSQL backend
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'בקשת האירוח אושרה!',
      message: 'משפחת כהן אישרה את בקשת האירוח שלך לשבת הקרובה.',
      time: 'לפני 10 דקות',
      isRead: false,
    },
    {
      id: 2,
      type: 'message',
      title: 'הודעה חדשה',
      message: 'משפחת ישראלי שלחה לך הודעה בצ\'אט.',
      time: 'לפני שעה',
      isRead: false,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'עדכון מערכת',
      message: 'נוספו 5 משפחות חדשות באזור ירושלים.',
      time: 'אתמול',
      isRead: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
    // Here you would also route the user to the relevant page (e.g., chat or request board)
    setIsOpen(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="nb-icon-success" />;
      case 'message': return <MessageSquare size={18} className="nb-icon-message" />;
      case 'alert': return <AlertCircle size={18} className="nb-icon-alert" />;
      default: return <Bell size={18} className="nb-icon-default" />;
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className={`nb-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="התראות"
      >
        <div className="navbar-left">
          <div className="notification-bell">
            <Bell className="nav-icon" size={22} />
            {unreadCount > 0 && (
              <span className="bell-badge"></span>
            )}        </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="nb-dropdown">
          <div className="nb-header">
            {unreadCount > 0 && (
              <>
              <h3>{unreadCount} התראות חדשות</h3>
              <button className="nb-mark-read-btn" onClick={markAllAsRead}>
                <Check size={14} /> סמן הכל כנקרא
              </button>
            </>
            )}
          </div>

          <div className="nb-list">
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <Bell size={32} strokeWidth={1} />
                <p>אין לך התראות חדשות</p>
              </div>
            ) : (
              notifications.map((note) => (
                <div
                  key={note.id}
                  className={`nb-item ${!note.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(note.id)}
                >
                  <div className="nb-item-icon">
                    {getIcon(note.type)}
                  </div>
                  <div className="nb-item-content">
                    <h4>{note.title}</h4>
                    <p>{note.message}</p>
                    <span className="nb-time">{note.time}</span>
                  </div>
                  {!note.isRead && <div className="nb-unread-dot" />}
                </div>
              ))
            )}
          </div>

          
        </div>
      )}
    </div>
  );
}