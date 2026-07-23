import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { receiveNotification, markAllAsRead, markAsRead } from '../../../store/notificationsSlice';
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Check } from 'lucide-react';
import './NotificationBell.css';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();

  // 1. Pull the current user from Redux so we know who to connect as
  const user = useSelector((state) => state.auth.user);
  // (Make sure this matches exactly how the ID is stored in your auth object, e.g., user.id or user._id)
  const userId = user?.id || user?.user_id; 

  // 2. Pull notification data straight from Redux
  const { items: notifications, unreadCount } = useSelector((state) => state.notifications);

  // 3. The WebSocket Connection Hook
  useEffect(() => {
    // Don't try to connect if the user isn't logged in yet
    if (!userId) return;

    // Open the connection to your FastAPI backend
    // (Adjust the port or URL if your backend runs somewhere other than localhost:8000)
    const apiUrl = import.meta.env.VITE_API_URL;
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/api/ws/notifications/${userId}` ;
    const socket = new WebSocket(wsUrl);
    

    socket.onopen = () => {
      console.log("🟢 Connected to live notifications");
    };

    // When FastAPI pushes a message, this function catches it instantly!
    socket.onmessage = (event) => {
      const incomingData = JSON.parse(event.data);
      // Send the new notification directly to Redux
      dispatch(receiveNotification(incomingData));
    };

    socket.onclose = () => {
      console.log("🔴 Disconnected from live notifications");
    };

    // Cleanup: Close the connection if the user logs out or leaves the site
    return () => {
      socket.close();
    };
  }, [userId, dispatch]);

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

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationClick = (id) => {
    dispatch(markAsRead(id));
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
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="nb-dropdown">
          <div className="nb-header">
            {unreadCount > 0 ? (
              <>
                <h3>{unreadCount} התראות חדשות</h3>
                <button className="nb-mark-read-btn" onClick={handleMarkAllAsRead}>
                  <Check size={14} /> סמן הכל כנקרא
                </button>
              </>
            ) : (
              <h3>התראות</h3>
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