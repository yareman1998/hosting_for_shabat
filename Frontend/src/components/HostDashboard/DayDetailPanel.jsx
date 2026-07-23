import  { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, MessageSquare, Lock, Unlock, RotateCcw } from 'lucide-react';
import {
  deselectDate,
  setOverride,
  clearOverride,
  computeDayStatus,
} from '../../store/availabilitySlice';

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

  const handleClose = useCallback(() => dispatch(deselectDate()), [dispatch]);

  if (!selectedDate) return null;

  const status = computeDayStatus(selectedDate, rules, overrides, bookings);
  const meta = STATUS_META[status] || STATUS_META.closed;
  const { dayName, dayNum, monthName, year } = formatDate(selectedDate);
  const hasOverride = !!overrides[selectedDate];
  const booking = bookings[selectedDate];
  const isPast = status === 'past';

  const handleOpen = () => dispatch(setOverride({ dateStr: selectedDate, status: 'open' }));
  const handleBlockDay = () => dispatch(setOverride({ dateStr: selectedDate, status: 'closed' }));
  const handleRevert = () => dispatch(clearOverride({ dateStr: selectedDate }));

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
