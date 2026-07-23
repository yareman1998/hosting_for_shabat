import { useState } from 'react';
import { Utensils, Users, Heart, Edit3, Loader2, AlertCircle, Clock, Check } from 'lucide-react';
import { formatHebrewDate, getRelativeTimeHebrew, checkPostUrgency } from '../../utils/date';
import RequestInlineEdit from './RequestInlineEdit';
import PendingOfferBox from './PendingOfferBox';

export default function RequestCard({ post, userRole, onAction, isClaiming, onUpdateSuccess }) {
  const [isEditingInline, setIsEditingInline] = useState(false);

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
  const isDirectRequest = Boolean(post.is_direct_request);

  let statusLabel = 'פתוח';
  if (post.status === 'matched' || post.status === 'approved') {
    statusLabel = 'אושר';
  } else if (post.status === 'pending') {
    if (isDirectRequest) {
      statusLabel = userRole === 'host' ? 'ממתין לאישורך' : 'ממתין לאישור המארח';
    } else {
      statusLabel = userRole === 'guest' ? 'ממתין לאישורך' : 'ממתין לתשובת החייל';
    }
  }

  if (isEditingInline) {
    return (
      <RequestInlineEdit
        post={post}
        onCancel={() => setIsEditingInline(false)}
        onSuccess={() => {
          setIsEditingInline(false);
          if (onUpdateSuccess) onUpdateSuccess();
        }}
      />
    );
  }

  return (
    <div className={`request-card ${showUrgentNotice ? 'urgent-border-highlight' : ''}`}>
      <div className="card-header">
        <div className="status-badges-group">
          {showUrgentNotice && (
            <span className="status-badge urgent-badge">
              <AlertCircle size={13} />
              דחוף - בעוד {hoursLeft === 0 ? 'פחות משעה' : `${hoursLeft} שעות`}!
            </span>
          )}
          <span className={`status-badge ${post.status === 'matched' ? 'matched' : post.status === 'pending' ? 'pending' : ''}`}>
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

      {(() => {
        const desc = post.description || '';
        const matchReturn = desc.match(/מביאים לאירוח:\s*([^\n]+)/);
        const inReturnVal = matchReturn ? matchReturn[1].trim() : null;
        const cleanDesc = desc.replace(/מביאים לאירוח:[^\n]+/, '').trim();

        return (
          <div className="card-description-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0 12px 0' }}>
            {inReturnVal && (
              <div style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, width: 'fit-content' }}>
                <span>מביאים לאירוח: </span>
                <span style={{ fontWeight: 700 }}>{inReturnVal}</span>
              </div>
            )}
            {cleanDesc && (
              <p className="card-description" style={{ margin: 0 }}>{cleanDesc}</p>
            )}
          </div>
        );
      })()}

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

      {/* Show PendingOfferBox only when a host offered on guest's public post */}
      {userRole === 'guest' && post.status === 'pending' && !isDirectRequest && (
        <PendingOfferBox
          post={post}
          onUpdateSuccess={onUpdateSuccess}
        />
      )}

      <div className="card-actions">
        {userRole === 'host' ? (
          post.status === 'pending' ? (
            isDirectRequest ? (
              <button
                className="action-button claim-button"
                onClick={() => onAction && onAction(post)}
                disabled={isClaiming}
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              >
                {isClaiming ? <Loader2 className="w-4 h-4 spin-icon" /> : <Check className="w-4 h-4" />}
                <span>אישור בקשה</span>
              </button>
            ) : (
              <button
                className="action-button claim-button"
                disabled={true}
                style={{ opacity: 0.85, backgroundColor: '#f59e0b', color: 'white', cursor: 'default' }}
              >
                <Clock className="w-4 h-4" />
                <span>ממתין לתשובת החייל...</span>
              </button>
            )
          ) : (
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
          )
        ) : (
          post.status !== 'pending' && (
            <button
              className="action-button edit-button"
              onClick={() => setIsEditingInline(true)}
            >
              <Edit3 className="w-4 h-4" />
              ערוך פוסט זה
            </button>
          )
        )}
      </div>
    </div>
  );
}
