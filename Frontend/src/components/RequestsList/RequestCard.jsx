import { useState } from 'react';
import { Utensils, Users, Heart, Edit3, Loader2, AlertCircle, Clock, X, Check } from 'lucide-react';
import { formatHebrewDate, getRelativeTimeHebrew, checkPostUrgency } from '../../utils/date';
import DateRangePicker from '../Common/DateRangePicker/DateRangePicker';
import { postsApi } from '../../api/api';

export default function RequestCard({ post, userRole, onAction, isClaiming, onUpdateSuccess }) {
  const [isEditingInline, setIsEditingInline] = useState(false);

  // Editable state
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7 || 7));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [dateRange, setDateRange] = useState(() => {
    const s = post.start_date || post.requested_date ? new Date(post.start_date || post.requested_date) : getDefaultDate();
    const e = post.end_date ? new Date(post.end_date) : null;
    return { startDate: s, endDate: e, nightsCount: post.nights_count || 0 };
  });

  const [description, setDescription] = useState(post.description || '');
  const [guestsCount, setGuestsCount] = useState(post.guests_count || 1);
  const [region, setRegion] = useState(post.region || 'מרכז');
  const [kashrut, setKashrut] = useState(post.kashrut || 'כשר');
  const [needsLodging, setNeedsLodging] = useState(post.needs_lodging || false);
  const [isAnonymous, setIsAnonymous] = useState(post.is_anonymous ?? true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Determine displayed name
  const isAnon = post.is_anonymous || post.guest_name === 'Soldier' || post.guest_name === 'Anonymous Guest' || post.guest_name === 'אנונימי' || post.guest_name === 'חייל אנונימי' || post.guest_name === 'אורח אנונימי';
  const displayName = isAnon ? 'אנונימי' : (post.guest_name || 'אורח');

  const unit = post.unit_name || post.service_type || 'חייל';
  const displayRegion = post.region || 'מרכז';
  const dateFormatted = formatHebrewDate(post.requested_date);
  const subtitle = `${unit} · ${displayRegion} · ${dateFormatted}`;

  // Time details
  const timeAgo = getRelativeTimeHebrew(post.created_at);

  // Status & Urgency mapping
  const isUnapproved = post.status !== 'matched' && post.status !== 'approved';
  const { isUrgent, hoursLeft } = checkPostUrgency(post.requested_date);
  const showUrgentNotice = isUnapproved && isUrgent;

  const statusLabel = post.status === 'open' ? 'פתוח' : 'אושר';

  const handleSaveInline = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('אנא הזן תיאור לבקשת האירוח');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      const startIso = dateRange.startDate.toISOString();
      const endIso = dateRange.endDate ? dateRange.endDate.toISOString() : null;

      await postsApi.update(post.id, {
        requested_date: startIso,
        start_date: startIso,
        end_date: endIso,
        nights_count: dateRange.nightsCount,
        description: description.trim(),
        guests_count: Number(guestsCount),
        region,
        kashrut,
        needs_lodging: needsLodging,
        is_anonymous: isAnonymous,
      });

      setIsEditingInline(false);
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      console.error('Failed to update post:', err);
      setError(err.response?.data?.detail || 'שגיאה בעדכון הבקשה');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDateLabel = () => {
    if (!dateRange.startDate) return 'בחירת תאריכים';
    const startStr = dateRange.startDate.toLocaleDateString('he-IL');
    if (!dateRange.endDate) return `הגעה: ${startStr}`;
    const endStr = dateRange.endDate.toLocaleDateString('he-IL');
    const nights = dateRange.nightsCount > 0 ? ` (${dateRange.nightsCount} לילות)` : '';
    return `${startStr} - ${endStr}${nights}`;
  };

  if (isEditingInline) {
    return (
      <div className="request-card inline-edit-card" dir="rtl">
        <form onSubmit={handleSaveInline} className="inline-edit-form">
          <div className="inline-edit-header">
            <div className="inline-edit-title-group">
              <div className="inline-edit-icon-badge">
                <Edit3 size={16} />
              </div>
              <h4>עריכת בקשת אירוח</h4>
            </div>
            <button
              type="button"
              className="inline-edit-date-btn"
              onClick={() => setShowDatePicker((prev) => !prev)}
            >
              <Clock size={14} />
              <span>{formattedDateLabel()}</span>
            </button>
          </div>

          {error && <div className="cpm-error text-xs">{error}</div>}

          <div className="inline-edit-body">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              dir="rtl"
              className="inline-edit-textarea"
              placeholder="תאר את עצמך ומה אתה מחפש בשבת..."
              required
            />

            {showDatePicker && (
              <div className="cpm-picker-container">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={({ startDate, endDate, nightsCount }) => {
                    setDateRange({ startDate, endDate, nightsCount });
                    if (startDate && endDate) setShowDatePicker(false);
                  }}
                />
              </div>
            )}

            <div className="inline-edit-fields-grid">
              <div className="inline-field-group">
                <label>אזור</label>
                <select
                  dir="rtl"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="inline-edit-select"
                >
                  <option value="מרכז">מרכז</option>
                  <option value="ירושלים">ירושלים</option>
                  <option value="צפון">צפון</option>
                  <option value="דרום">דרום</option>
                </select>
              </div>

              <div className="inline-field-group">
                <label>כשרות</label>
                <select
                  dir="rtl"
                  value={kashrut}
                  onChange={(e) => setKashrut(e.target.value)}
                  className="inline-edit-select"
                >
                  <option value="כשר">כשר</option>
                  <option value="מהדרין">מהדרין</option>
                  <option value="רגיל">רגיל</option>
                </select>
              </div>

              <div className="inline-field-group">
                <label>מספר אורחים</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  className="inline-edit-input"
                />
              </div>

              <div className="inline-edit-toggles">
                <label className="inline-toggle-label">
                  <input
                    type="checkbox"
                    checked={needsLodging}
                    onChange={(e) => setNeedsLodging(e.target.checked)}
                  />
                  <span>לינה נדרשת</span>
                </label>

                <label className="inline-toggle-label">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span>אנונימי</span>
                </label>
              </div>
            </div>
          </div>

          <div className="inline-edit-actions">
            <button
              type="button"
              onClick={() => setIsEditingInline(false)}
              className="inline-btn-cancel"
            >
              <X size={15} />
              <span>ביטול</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-btn-save"
            >
              {submitting ? (
                <Loader2 size={15} className="spin-icon" />
              ) : (
                <Check size={15} />
              )}
              <span>{submitting ? 'שומר...' : 'שמור שינויים'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`request-card ${showUrgentNotice ? 'urgent-card' : ''}`}>
      <div className="card-header">
        <div className="status-badge-container">
          {showUrgentNotice && (
            <span className="status-badge urgent-badge">
              <AlertCircle size={13} />
              דחוף - בעוד {hoursLeft === 0 ? 'פחות משעה' : `${hoursLeft} שעות`}!
            </span>
          )}
          <span className={`status-badge ${post.status === 'matched' ? 'matched' : ''}`}>
            {statusLabel}
          </span>
        </div>
        <div className="user-info-container">
          <div className="user-name-row">
            <h3>{displayName}</h3>
          </div>
          <p className="card-subtitle">{subtitle}</p>
        </div>
      </div>

      <p className="card-description">{post.description}</p>

      <div className="card-tags">
        <span className="card-tag tag-kashrut">
          <Utensils className="w-3 h-3" />
          {post.kashrut || 'כשר'}
        </span>
        <span className="card-tag tag-guests">
          <Users className="w-3 h-3" />
          {post.guests_count} אורחים
        </span>
        <span className="tag-time">{timeAgo}</span>
      </div>

      <div className="card-actions">
        {userRole === 'host' ? (
          <button
            className={`action-button claim-button ${showUrgentNotice ? 'urgent-claim-btn' : ''}`}
            onClick={() => onAction && onAction(post)}
            disabled={post.status === 'matched' || isClaiming}
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 spin-icon" />
                <span>שולח למערכת...</span>
              </>
            ) : post.status === 'matched' ? (
              'בקשה זו אושרה'
            ) : showUrgentNotice ? (
              <>
                <Clock className="w-4 h-4" />
                <span>דרוש עכשיו</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                <span>דרוש בקשה זו</span>
              </>
            )}
          </button>
        ) : (
          <button
            className="action-button edit-button"
            onClick={() => setIsEditingInline(true)}
          >
            <Edit3 className="w-4 h-4" />
            ערוך פוסט זה
          </button>
        )}
      </div>
    </div>
  );
}


