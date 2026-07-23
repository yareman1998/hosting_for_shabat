import  { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { navigateMonth, selectDate, computeDayStatus } from '../../store/availabilitySlice';

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const DAY_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

const STATUS_CLASS = {
  open: 'day--open',
  closed: 'day--closed',
  booked: 'day--booked',
  past: 'day--past',
  notice_closed: 'day--notice',
};

const STATUS_LABEL = {
  open: 'פתוח',
  closed: 'סגור',
  booked: 'תפוס',
  past: '',
  notice_closed: 'עבר מועד',
};

export default function AvailabilityCalendar() {
  const dispatch = useDispatch();
  const { rules, overrides, bookings, currentMonth, currentYear, selectedDate, viewMode } =
    useSelector((s) => s.availability);
  const posts = useSelector((s) => s.requests?.posts || []);

  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const pendingDatesSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(posts)) {
      posts.forEach((p) => {
        if (p.status === 'pending' || p.status === 'open') {
          const startDateVal = p.start_date || p.requested_date || p.shabbat_date;
          const endDateVal = p.end_date;

          if (startDateVal) {
            const startD = new Date(startDateVal);
            if (!isNaN(startD.getTime())) {
              const startStr = toDateStr(startD.getFullYear(), startD.getMonth(), startD.getDate());
              set.add(startStr);

              if (endDateVal) {
                const endD = new Date(endDateVal);
                if (!isNaN(endD.getTime()) && endD >= startD) {
                  const curr = new Date(startD);
                  while (curr <= endD) {
                    const cStr = toDateStr(curr.getFullYear(), curr.getMonth(), curr.getDate());
                    set.add(cStr);
                    curr.setDate(curr.getDate() + 1);
                  }
                }
              }
            }
          }
        }
      });
    }
    if (bookings && typeof bookings === 'object') {
      Object.entries(bookings).forEach(([dStr, b]) => {
        if (b?.status === 'pending') {
          set.add(dStr);
        }
      });
    }
    return set;
  }, [posts, bookings]);

  const dayCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDow = getFirstDayOfWeek(currentYear, currentMonth);
    const cells = [];

    for (let i = 0; i < firstDow; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateStr(currentYear, currentMonth, d);
      const date = new Date(currentYear, currentMonth, d);
      const dayOfWeek = date.getDay();
      const isWeekend = rules.weekendDays.includes(dayOfWeek);
      const status = computeDayStatus(dateStr, rules, overrides, bookings);
      const hasOverride = !!overrides[dateStr];
      const hasPendingRequest = pendingDatesSet.has(dateStr);
      cells.push({ empty: false, day: d, dateStr, dayOfWeek, isWeekend, status, hasOverride, hasPendingRequest, key: dateStr });
    }

    return cells;
  }, [currentYear, currentMonth, rules, overrides, bookings, pendingDatesSet]);

  const weekCells = useMemo(() => {
    if (viewMode !== 'week') return null;
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const cells = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      const dayOfWeek = d.getDay();
      const isWeekend = rules.weekendDays.includes(dayOfWeek);
      const status = computeDayStatus(dateStr, rules, overrides, bookings);
      const hasOverride = !!overrides[dateStr];
      const hasPendingRequest = pendingDatesSet.has(dateStr);
      cells.push({ day: d.getDate(), dateStr, dayOfWeek, isWeekend, status, hasOverride, hasPendingRequest, key: dateStr });
    }
    return cells;
  }, [viewMode, rules, overrides, bookings, pendingDatesSet]);

  const handleDayClick = (dateStr, status) => {
    if (status === 'past') return;
    dispatch(selectDate(dateStr));
  };

  return (
    <div className="ac-root">
      <div className="ac-header">
        <button className="ac-nav-btn" id="cal-prev-month" onClick={() => dispatch(navigateMonth(-1))} aria-label="חודש קודם">
          <ChevronRight size={20} />
        </button>
        <h2 className="ac-month-title">{HEBREW_MONTHS[currentMonth]} {currentYear}</h2>
        <button className="ac-nav-btn" id="cal-next-month" onClick={() => dispatch(navigateMonth(1))} aria-label="חודש הבא">
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="ac-legend">
        <span className="legend-item"><span className="legend-dot dot--open" />פתוח לאירוח</span>
        <span className="legend-item"><span className="legend-dot dot--booked" />תפוס</span>
        <span className="legend-item"><span className="legend-dot dot--closed" />חסום</span>
        <span className="legend-item"><span className="legend-dot dot--notice" />עבר מועד</span>
      </div>

      {viewMode === 'month' ? (
        <>
          <div className="ac-grid-headers">
            {DAY_HEADERS.map((h) => <span key={h} className="ac-dow-header">{h}</span>)}
          </div>

          <div className="ac-grid">
            {dayCells.map((cell) =>
              cell.empty ? (
                <div key={cell.key} className="ac-cell ac-cell--empty" />
              ) : (
                <button
                  key={cell.key}
                  id={`cal-day-${cell.dateStr}`}
                  className={[
                    'ac-cell',
                    STATUS_CLASS[cell.status] || 'day--closed',
                    cell.isWeekend ? 'ac-cell--weekend' : '',
                    cell.dateStr === todayStr ? 'ac-cell--today' : '',
                    cell.dateStr === selectedDate ? 'ac-cell--selected' : '',
                    cell.hasOverride ? 'ac-cell--override' : '',
                  ].join(' ')}
                  onClick={() => handleDayClick(cell.dateStr, cell.status)}
                  aria-label={`${cell.day} בחודש, ${STATUS_LABEL[cell.status] || ''}`}
                  aria-pressed={cell.dateStr === selectedDate}
                >
                  <span className="ac-day-number">{cell.day}</span>
                  {cell.hasPendingRequest && (
                    <span className="ac-pending-request-dot" title="ישנה בקשת אירוח ממתינה" />
                  )}
                  {cell.hasOverride && <span className="ac-override-dot" title="שינוי ידני" />}
                  {cell.status === 'booked' && <span className="ac-booking-dot" />}
                  {STATUS_LABEL[cell.status] && cell.status !== 'past' && (
                    <span className="ac-day-label">{STATUS_LABEL[cell.status]}</span>
                  )}
                </button>
              )
            )}
          </div>
        </>
      ) : (
        <div className="ac-agenda">
          {weekCells.map((cell) => (
            <button
              key={cell.key}
              id={`cal-agenda-${cell.dateStr}`}
              className={[
                'ac-agenda-row',
                STATUS_CLASS[cell.status] || 'day--closed',
                cell.isWeekend ? 'ac-agenda-row--weekend' : '',
                cell.dateStr === todayStr ? 'ac-agenda-row--today' : '',
                cell.dateStr === selectedDate ? 'ac-agenda-row--selected' : '',
              ].join(' ')}
              onClick={() => handleDayClick(cell.dateStr, cell.status)}
            >
              <div className="agenda-date-col">
                <span className="agenda-day-num">{cell.day}</span>
                <span className="agenda-dow">{DAY_HEADERS[cell.dayOfWeek]}</span>
              </div>
              <div className="agenda-status-col">
                <span className={`agenda-badge agenda-badge--${cell.status}`}>
                  {STATUS_LABEL[cell.status] || 'עבר'}
                </span>
                {cell.hasOverride && <span className="agenda-override-tag">שינוי ידני</span>}
              </div>
              {cell.status === 'booked' && bookings[cell.dateStr] && (
                <div className="agenda-booking-col">
                  <span className="agenda-guest-name">{bookings[cell.dateStr].guestName}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
