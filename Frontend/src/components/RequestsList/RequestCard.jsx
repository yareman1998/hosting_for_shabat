import { Utensils, Users, Heart, Edit3 } from 'lucide-react';
import { formatHebrewDate, getRelativeTimeHebrew } from '../../utils/date';

export default function RequestCard({ post, userRole, onAction }) {
  // Determine displayed name
  const isAnonymous = post.is_anonymous || post.guest_name === 'Soldier' || post.guest_name === 'Anonymous Guest';
  const displayName = isAnonymous ? 'חייל אנונימי' : (post.guest_name || 'אורח');

  // Determine subtitle details: "מוצנח · מרכז · שישי, 18 ביולי 2025"
  const unit = post.unit_name || post.service_type || 'חייל';
  const region = post.region || 'מרכז';
  const dateFormatted = formatHebrewDate(post.requested_date);
  const subtitle = `${unit} · ${region} · ${dateFormatted}`;

  // Time details
  const timeAgo = getRelativeTimeHebrew(post.created_at);

  // Status mapping
  const statusLabel = post.status === 'open' ? 'פתוח' : 'אושר';

  return (
    <div className="request-card">
      <div className="card-header">
        <div className="status-badge-container">
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
            className="action-button claim-button"
            onClick={() => onAction && onAction(post)}
            disabled={post.status === 'matched'}
          >
            <Heart className="w-4 h-4" />
            {post.status === 'matched' ? 'בקשה זו אושרה' : 'דרוש בקשה זו'}
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
