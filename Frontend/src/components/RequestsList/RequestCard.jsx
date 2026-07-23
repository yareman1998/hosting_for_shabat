import { Utensils, Users, Heart, Edit3, Loader2, AlertCircle, Clock } from 'lucide-react';
import { formatHebrewDate, getRelativeTimeHebrew, checkPostUrgency } from '../../utils/date';

export default function RequestCard({ post, userRole, onAction, isClaiming }) {
  // Determine displayed name
  const isAnonymous = post.is_anonymous || post.guest_name === 'Soldier' || post.guest_name === 'Anonymous Guest' || post.guest_name === 'אנונימי' || post.guest_name === 'חייל אנונימי' || post.guest_name === 'אורח אנונימי';
  const displayName = isAnonymous ? 'אנונימי' : (post.guest_name || 'אורח');

  const unit = post.unit_name || post.service_type || 'חייל';
  const region = post.region || 'מרכז';
  const dateFormatted = formatHebrewDate(post.requested_date);
  const subtitle = `${unit} · ${region} · ${dateFormatted}`;

  // Time details
  const timeAgo = getRelativeTimeHebrew(post.created_at);

  // Status & Urgency mapping
  const isUnapproved = post.status !== 'matched' && post.status !== 'approved';
  const { isUrgent, hoursLeft } = checkPostUrgency(post.requested_date);
  const showUrgentNotice = isUnapproved && isUrgent;

  const statusLabel = post.status === 'open' ? 'פתוח' : 'אושר';

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
            onClick={() => onAction && onAction(post)}
          >
            <Edit3 className="w-4 h-4" />
            ערוך פוסט זה
          </button>
        )}
      </div>
    </div>
  );
}

