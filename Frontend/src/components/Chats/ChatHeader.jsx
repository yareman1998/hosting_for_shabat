import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { WhatsAppIcon } from '../Common/Icons';
import { Info, X, Calendar, User, Phone, MapPin, CheckCircle2, Shield, Users, Home } from 'lucide-react';

export function ChatHeader({ activeChat }) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const currentUser = useSelector((state) => state.auth.user);
  const isHost = currentUser?.user_type === 'host';

  const buttonText = isHost ? 'פרטי אורח' : 'פרטי אירוח';
  const modalTitle = isHost ? 'פרטי האורח' : 'פרטי האירוח לשבת';

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
    <>
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

          {/* Dynamic Details Button */}
          <button
            type="button"
            className="chat-header-details-btn"
            onClick={() => setShowDetailsModal(true)}
            data-tooltip={buttonText}
          >
            <User size={16} />
            <span>{buttonText}</span>
          </button>

          {/* WhatsApp Button */}
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

      {/* Hosting/Guest Details Popup Modal */}
      {showDetailsModal && (
        <div className="chat-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="chat-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal-header">
              <div className="chat-modal-title">
                <User size={20} className="chat-modal-icon" />
                <h3>{modalTitle}</h3>
              </div>
              <button 
                type="button" 
                className="chat-modal-close" 
                onClick={() => setShowDetailsModal(false)}
                aria-label="סגור"
              >
                <X size={18} />
              </button>
            </div>

            <div className="chat-modal-body">
              {/* Full Name */}
              <div className="chat-modal-row">
                <User size={18} className="chat-modal-row-icon" />
                <div>
                  <span className="chat-modal-label">{isHost ? 'שם האורח' : 'שם המארח'}</span>
                  <p className="chat-modal-value">{activeChat.other_party_name || (isHost ? 'אורח' : 'מארח')}</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="chat-modal-row">
                <Phone size={18} className="chat-modal-row-icon" />
                <div>
                  <span className="chat-modal-label">מספר טלפון</span>
                  <p className="chat-modal-value" dir="ltr" style={{ textAlign: 'right' }}>
                    {activeChat.other_party_phone || 'לא עודכן מס׳ טלפון'}
                  </p>
                </div>
              </div>

              {isHost ? (
                <>
                  {/* Service Type / Status */}
                  {(activeChat.service_type || activeChat.is_soldier_or_national_service !== undefined) && (
                    <div className="chat-modal-row">
                      <Shield size={18} className="chat-modal-row-icon" />
                      <div>
                        <span className="chat-modal-label">סוג שירות / סטטוס</span>
                        <p className="chat-modal-value">
                          {activeChat.service_type || (activeChat.is_soldier_or_national_service ? 'חייל / שירות לאומי' : 'אזרח')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Unit/Role */}
                  {(activeChat.unit_name || activeChat.guest_unit) && (
                    <div className="chat-modal-row">
                      <Shield size={18} className="chat-modal-row-icon" />
                      <div>
                        <span className="chat-modal-label">יחידה / תפקיד</span>
                        <p className="chat-modal-value">{activeChat.unit_name || activeChat.guest_unit}</p>
                      </div>
                    </div>
                  )}

                  {/* Guests Count */}
                  {activeChat.guests_count && (
                    <div className="chat-modal-row">
                      <Users size={18} className="chat-modal-row-icon" />
                      <div>
                        <span className="chat-modal-label">כמות אורחים</span>
                        <p className="chat-modal-value">{activeChat.guests_count} חבר'ה</p>
                      </div>
                    </div>
                  )}

                  {/* Guest Origin City */}
                  {(activeChat.origin_city || activeChat.guest_city) && (
                    <div className="chat-modal-row">
                      <Home size={18} className="chat-modal-row-icon" />
                      <div>
                        <span className="chat-modal-label">עיר מגורים</span>
                        <p className="chat-modal-value">{activeChat.origin_city || activeChat.guest_city}</p>
                      </div>
                    </div>
                  )}

                  {/* Food preferences / allergies */}
                  {(activeChat.food_preferences_allergies || activeChat.food_preferences) && (
                    <div className="chat-modal-row">
                      <Info size={18} className="chat-modal-row-icon" />
                      <div>
                        <span className="chat-modal-label">העדפות מזון / אלרגיות</span>
                        <p className="chat-modal-value">{activeChat.food_preferences_allergies || activeChat.food_preferences}</p>
                      </div>
                    </div>
                  )}

                  {/* Skills / Notes */}
                  {(activeChat.skills_give_take || activeChat.notes) && (
                    <div className="chat-modal-row">
                      <Info size={18} className="chat-modal-row-icon" />
                      <div>
                        <span className="chat-modal-label">כישורים / הערות</span>
                        <p className="chat-modal-value">{activeChat.skills_give_take || activeChat.notes}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Guest view: Hosting Location */}
                  <div className="chat-modal-row">
                    <MapPin size={18} className="chat-modal-row-icon" />
                    <div>
                      <span className="chat-modal-label">מיקום אירוח</span>
                      <p className="chat-modal-value">
                        {activeChat.location || activeChat.city || activeChat.address || 'ירושלים והסביבה'}
                      </p>
                    </div>
                  </div>

                  {/* Hosting Date */}
                  <div className="chat-modal-row">
                    <Calendar size={18} className="chat-modal-row-icon" />
                    <div>
                      <span className="chat-modal-label">תאריך אירוח</span>
                      <p className="chat-modal-value">
                        {activeChat.hosting_date ? formatDate(activeChat.hosting_date) : 'לא מצוין תאריך'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="chat-modal-footer">
              <button
                type="button"
                className="chat-modal-btn-close"
                onClick={() => setShowDetailsModal(false)}
              >
                סגור
              </button>
              {activeChat.other_party_phone && (
                <a
                  href={`https://wa.me/${activeChat.other_party_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`שלום, בהקשר לאירוח בתאריך ${formatShortDate(activeChat.hosting_date) || formatDate(activeChat.hosting_date) || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-modal-btn-wa"
                >
                  <WhatsAppIcon size={16} />
                  פתח בוואצאפ
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

