import React from 'react';
import { WhatsAppIcon } from '../Common/Icons';

export function ChatHeader({ activeChat }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="chat-header">
      <div className="chat-header-user">
        <div className="chat-header-avatar">
          {activeChat.other_party_name?.charAt(0) || 'א'}
        </div>
        <div>
          <h2 className="chat-header-title">
            {activeChat.hosting_date
              ? `${formatShortDate(activeChat.hosting_date)} · ${activeChat.other_party_name}`
              : activeChat.other_party_name}
          </h2>
          <p className="chat-header-status">
            <span className="chat-header-status-dot"></span>
            מחובר (מאושר)
          </p>
        </div>
      </div>
      <div className="chat-header-actions">
        {activeChat.hosting_date && (
          <div className="chat-header-date">
            {formatDate(activeChat.hosting_date)}
          </div>
        )}
        <a
          href={`https://wa.me/${activeChat.other_party_phone ? activeChat.other_party_phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(`שלום, בהקשר לאירוח בתאריך ${formatShortDate(activeChat.hosting_date) || formatDate(activeChat.hosting_date) || ''}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-header-wa-btn"
          data-tooltip="לחיצה על זה יפתח קישור לוואצאפ"
        >
          <WhatsAppIcon size={16} />
        </a>
      </div>
    </div>
  );
}
