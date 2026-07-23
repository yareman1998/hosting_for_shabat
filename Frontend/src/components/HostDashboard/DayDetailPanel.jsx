import { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, MessageSquare, Lock, Unlock, RotateCcw, Check, User, Loader2 } from 'lucide-react';
import {
  deselectDate,
  setOverride,
  clearOverride,
  computeDayStatus,
  fetchAvailability,
} from '../../store/availabilitySlice';
import { fetchPosts } from '../../store/requestsSlice';
import { postsApi, bookingsApi } from '../../api/api';

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    dayName: HEBREW_DAYS[date.getDay()],
    dayNum: day,
    monthName: HEBREW_MONTHS[month - 1],
    year,
  };
}

const STATUS_META = {
  open: { label: 'פתוח לאירוח', className: 'ddp-status--open', emoji: '🟢' },
  closed: { label: 'חסום / סגור', className: 'ddp-status--closed', emoji: '🔴' },
  booked: { label: 'תפוס – אורחים', className: 'ddp-status--booked', emoji: '🔵' },
  past: { label: 'תאריך עבר', className: 'ddp-status--past', emoji: '⚪' },
  notice_closed: { label: 'חסום (עבר מועד)', className: 'ddp-status--notice', emoji: '🟡' },
};

export default function DayDetailPanel() {
  const dispatch = useDispatch();
  const { selectedDate, rules, overrides, bookings } = useSelector((s) => s.availability);
  const posts = useSelector((s) => s.requests?.posts || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => dispatch(deselectDate()), [dispatch]);

  if (!selectedDate) return null;

  const status = computeDayStatus(selectedDate, rules, overrides, bookings);
  const meta = STATUS_META[status] || STATUS_META.closed;
  const { dayName, dayNum, monthName, year } = formatDate(selectedDate);
  const hasOverride = !!overrides[selectedDate];
  const booking = bookings[selectedDate];
  const isPast = status === 'past';

  const pendingRequest = posts?.find((p) => {
    const isPending = p.status === 'pending' || p.status === 'open';
    if (!isPending) return false;
    const startDateVal = p.start_date || p.requested_date || p.shabbat_date;
    if (!startDateVal) return false;
    const startD = String(startDateVal).split('T')[0];
    if (startD === selectedDate) return true;
    if (p.end_date) {
      const endD = String(p.end_date).split('T')[0];
      return selectedDate >= startD && selectedDate <= endD;
    }
    return false;
  });

  const handleOpen = () => dispatch(setOverride({ dateStr: selectedDate, status: 'open' }));
  const handleBlockDay = () => dispatch(setOverride({ dateStr: selectedDate, status: 'closed' }));
  const handleRevert = () => dispatch(clearOverride({ dateStr: selectedDate }));

  const handleApproveRequest = async (post) => {
    try {
      setIsSubmitting(true);
      if (post.pending_match_id) {
        await bookingsApi.respondToBooking(post.pending_match_id, 'matched');
      } else {
        await postsApi.claimPost(post.id);
      }
      dispatch(fetchPosts());
      dispatch(fetchAvailability());
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert('שגיאה באישור הבקשה: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRequest = async (post) => {
    try {
      setIsSubmitting(true);
      if (post.pending_match_id) {
        await bookingsApi.respondToBooking(post.pending_match_id, 'rejected');
      } else {
        await bookingsApi.respondToBooking(post.id, 'rejected');
      }
      dispatch(fetchPosts());
      dispatch(fetchAvailability());
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert('שגיאה בדחיית הבקשה: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = booking?.guestPhone
    ? `https://wa.me/972${booking.guestPhone.replace(/^0/, '')}?text=${encodeURIComponent('שלום! זהו מנהל המארח מ"שבת שלום". אשמח לדבר אתך לפני השבת 🕯️')}`
    : null;

  return (
    <>
      <div className="ddp-overlay" onClick={handleClose} aria-hidden="true" />
      <aside className="ddp-panel" role="dialog" aria-modal="true" aria-label="פרטי תאריך">

        <div className="ddp-header">
          <div className="ddp-header-info">
            <p className="ddp-day-name">{dayName}</p>
            <h2 className="ddp-date-title">{dayNum} ב{monthName} {year}</h2>
          </div>
          <button className="ddp-close-btn" id="ddp-close" onClick={handleClose} aria-label="סגור">
            <X size={20} />
          </button>
        </div>

        <div className={`ddp-status-badge ${meta.className}`}>
          <span className="ddp-status-emoji">{meta.emoji}</span>
          <span className="ddp-status-label">{meta.label}</span>
          {hasOverride && <span className="ddp-override-tag">שינוי ידני</span>}
        </div>

        {/* ── Pending Request Card & Actions ── */}
        {pendingRequest && (
          <div className="ddp-booking-card" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', marginBottom: '16px' }}>
            <div className="ddp-booking-header" style={{ color: '#0369a1' }}>
              <User size={18} />
              <h3>בקשת אירוח ממתינה</h3>
            </div>

            <div className="ddp-booking-row">
              <span className="ddp-booking-label">שם האורח</span>
              <span className="ddp-booking-value" style={{ fontWeight: 700 }}>{pendingRequest.guest_name || 'אורח'}</span>
            </div>

            {pendingRequest.unit_name && (
              <div className="ddp-booking-row">
                <span className="ddp-booking-label">יחידה / תפקיד</span>
                <span className="ddp-booking-value">{pendingRequest.unit_name}</span>
              </div>
            )}

            <div className="ddp-booking-row">
              <span className="ddp-booking-label">כמות חבר'ה</span>
              <span className="ddp-booking-value" style={{ fontWeight: 600, color: '#2563eb' }}>
                {pendingRequest.guests_count || 1} חבר'ה
              </span>
            </div>

            {pendingRequest.nights_count && pendingRequest.nights_count > 1 && (
              <div className="ddp-booking-row">
                <span className="ddp-booking-label">משך אירוח</span>
                <span className="ddp-booking-value">{pendingRequest.nights_count} לילות</span>
              </div>
            )}

            {(() => {
              const desc = pendingRequest.description || '';
              const matchReturn = desc.match(/מביאים לאירוח:\s*([^\n]+)/);
              const inReturnVal = matchReturn ? matchReturn[1].trim() : null;
              const cleanDesc = desc.replace(/מביאים לאירוח:[^\n]+/, '').trim();

              return (
                <>
                  {inReturnVal && (
                    <div className="ddp-booking-row" style={{ backgroundColor: '#f0fdf4', padding: '6px 8px', borderRadius: '6px', border: '1px solid #bbf7d0', marginTop: '4px' }}>
                      <span className="ddp-booking-label" style={{ color: '#166534', fontWeight: 600 }}>מביאים לאירוח</span>
                      <span className="ddp-booking-value" style={{ color: '#15803d', fontWeight: 700 }}>{inReturnVal}</span>
                    </div>
                  )}
                  {cleanDesc && (
                    <div className="ddp-booking-row" style={{ marginTop: '4px' }}>
                      <span className="ddp-booking-label">הערות האורח</span>
                      <span className="ddp-booking-value">{cleanDesc}</span>
                    </div>
                  )}
                </>
              );
            })()}

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button
                onClick={() => handleApproveRequest(pendingRequest)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isSubmitting ? 0.6 : 1,
                  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
                }}
              >
                {isSubmitting ? <Loader2 size={16} className="spin-icon" /> : <Check size={16} />}
                <span>אישור בקשה</span>
              </button>

              <button
                onClick={() => handleRejectRequest(pendingRequest)}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {isSubmitting ? <Loader2 size={16} className="spin-icon" /> : <X size={16} />}
                <span>דחיית בקשה</span>
              </button>
            </div>
          </div>
        )}

        {status === 'booked' && booking && (
          <div className="ddp-booking-card">
            <div className="ddp-booking-header">
              <MessageSquare size={16} />
              <h3>פרטי האורחים</h3>
            </div>
            <div className="ddp-booking-row">
              <span className="ddp-booking-label">שם</span>
              <span className="ddp-booking-value">{booking.guestName || '—'}</span>
            </div>
            {booking.guestPhone && (
              <div className="ddp-booking-row">
                <span className="ddp-booking-label">טלפון</span>
                <span className="ddp-booking-value" dir="ltr">{booking.guestPhone}</span>
              </div>
            )}
            {booking.notes && (
              <div className="ddp-booking-row">
                <span className="ddp-booking-label">הערות</span>
                <span className="ddp-booking-value">{booking.notes}</span>
              </div>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="ddp-whatsapp-btn" id="ddp-whatsapp">
                💬 פנה לאורח ב-WhatsApp
              </a>
            )}
          </div>
        )}

        {!isPast && status !== 'booked' && (
          <div className="ddp-actions">
            <p className="ddp-actions-label">שנה סטטוס יום זה:</p>
            {status !== 'open' ? (
              <button id="ddp-action-open" className="ddp-action-btn ddp-action-btn--open" onClick={handleOpen}>
                <Unlock size={16} /> פתח לאירוח
              </button>
            ) : (
              <button id="ddp-action-close" className="ddp-action-btn ddp-action-btn--close" onClick={handleBlockDay}>
                <Lock size={16} /> סגור תאריך זה
              </button>
            )}
            {hasOverride && (
              <button id="ddp-action-revert" className="ddp-action-btn ddp-action-btn--revert" onClick={handleRevert}>
                <RotateCcw size={14} /> חזור לכלל הקבוע
              </button>
            )}
          </div>
        )}

        {status === 'notice_closed' && (
          <div className="ddp-notice-info">
            <p>
              היום עבר את שעת ההתרעה הקבועה ({rules.noticeCutoffHour}:00).
              באפשרותך לפתוח אותו ידנית אם ברצונך לקבל אורחים בכל זאת.
            </p>
          </div>
        )}

      </aside>
    </>
  );
}
