import  { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Calendar, Lock, Settings } from 'lucide-react';
import { setRules, closeRulesModal } from '../../store/availabilitySlice';

const WEEKEND_PATTERN_OPTIONS = [
  { value: 'every',    label: 'כל סופ״ש',                desc: 'פתוח בכל שישי ושבת' },
  { value: 'biweekly', label: 'כל שבוע שני (Bi-weekly)', desc: 'פתוח שבוע כן, שבוע לא' },
  { value: 'monthly',  label: 'פעם בחודש',               desc: 'רק בסופ״ש מסוים בחודש' },
  { value: 'never',    label: 'סגור קבוע',               desc: 'לא מקבל אורחים בסופ״ש' },
];

const WEEKDAY_LABELS = [
  { dow: 0, label: 'ראשון' },
  { dow: 1, label: 'שני' },
  { dow: 2, label: 'שלישי' },
  { dow: 3, label: 'רביעי' },
  { dow: 4, label: 'חמישי' },
];

const WEEKEND_DAYS_OPTIONS = [
  { value: [4, 5, 6], label: 'חמישי–שישי–שבת' },
  { value: [5, 6],    label: 'שישי–שבת (ברירת מחדל)' },
  { value: [6],       label: 'שבת בלבד' },
];

const MONTHLY_OPTIONS = [1, 2, 3, 4].map((n) => ({
  value: n,
  label: ['ראשון', 'שני', 'שלישי', 'רביעי'][n - 1] + ' בחודש',
}));

function arraysEqual(a, b) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}

export default function RulesSettingsModal() {
  const dispatch = useDispatch();
  const { rules, rulesModalOpen } = useSelector((s) => s.availability);

  const [draft, setDraft] = useState(rules);

  useEffect(() => {
    if (rulesModalOpen) setDraft(rules);
  }, [rulesModalOpen, rules]);

  if (!rulesModalOpen) return null;

  const handleClose = () => dispatch(closeRulesModal());
  const handleSave = () => {
    dispatch(setRules(draft));
    dispatch(closeRulesModal());
  };

  const toggleWeekday = (dow) => {
    const next = draft.weekdayOpenDays.includes(dow)
      ? draft.weekdayOpenDays.filter((d) => d !== dow)
      : [...draft.weekdayOpenDays, dow];
    setDraft((p) => ({ ...p, weekdayOpenDays: next }));
  };

  return (
    <div className="rsm-backdrop" role="dialog" aria-modal="true" aria-label="הגדרות כללי זמינות">
      <div className="rsm-modal">

        {/* Header */}
        <div className="rsm-modal-header">
          <div className="rsm-header-left">
            <div className="rsm-header-icon"><Settings size={20} /></div>
            <div>
              <h2>הגדרות זמינות</h2>
              <p>קבע את כללי האירוח הקבועים שלך</p>
            </div>
          </div>
          <button id="rsm-close" className="rsm-close-btn" onClick={handleClose} aria-label="סגור">
            <X size={20} />
          </button>
        </div>

        <div className="rsm-modal-body">

          {/* 1. Weekend Pattern */}
          <section className="rsm-section">
            <h3 className="rsm-section-title"><Calendar size={16} /> תדירות אירוח סופ״ש</h3>
            <div className="rsm-pattern-grid">
              {WEEKEND_PATTERN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  id={`rsm-pattern-${opt.value}`}
                  className={`rsm-pattern-card ${draft.weekendPattern === opt.value ? 'rsm-pattern-card--active' : ''}`}
                  onClick={() => setDraft((p) => ({ ...p, weekendPattern: opt.value }))}
                >
                  <span className="rsm-pattern-label">{opt.label}</span>
                  <span className="rsm-pattern-desc">{opt.desc}</span>
                </button>
              ))}
            </div>

            {draft.weekendPattern === 'monthly' && (
              <div className="rsm-sub-option">
                <label className="rsm-sub-label">איזה סופ״ש בחודש?</label>
                <div className="rsm-radio-row">
                  {MONTHLY_OPTIONS.map((opt) => (
                    <label key={opt.value} className="rsm-radio-label">
                      <input type="radio" name="monthlyOccurrence" value={opt.value}
                        checked={draft.monthlyOccurrence === opt.value}
                        onChange={() => setDraft((p) => ({ ...p, monthlyOccurrence: opt.value }))} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {draft.weekendPattern === 'biweekly' && (
              <div className="rsm-sub-option">
                <label className="rsm-sub-label">איזה שבוע פתוח?</label>
                <div className="rsm-radio-row">
                  {[{ v: 0, l: 'שבוע זוגי' }, { v: 1, l: 'שבוע אי-זוגי' }].map(({ v, l }) => (
                    <label key={v} className="rsm-radio-label">
                      <input type="radio" name="biweeklyParity"
                        checked={draft.biweeklyParity === v}
                        onChange={() => setDraft((p) => ({ ...p, biweeklyParity: v }))} />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 2. Weekend Definition */}
          <section className="rsm-section">
            <h3 className="rsm-section-title">🕯️ הגדרת "סוף שבוע" אצלי</h3>
            <div className="rsm-weekend-days-grid">
              {WEEKEND_DAYS_OPTIONS.map((opt) => (
                <button key={opt.label}
                  className={`rsm-pattern-card ${arraysEqual(draft.weekendDays, opt.value) ? 'rsm-pattern-card--active' : ''}`}
                  onClick={() => setDraft((p) => ({ ...p, weekendDays: opt.value }))}>
                  <span className="rsm-pattern-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3. Weekday Open Days */}
          <section className="rsm-section">
            <h3 className="rsm-section-title">📅 ימי אמצע שבוע פתוחים</h3>
            <p className="rsm-section-hint">סמן ימים שבהם אתה מוכן לקבל אורחים בשגרה</p>
            <div className="rsm-weekday-checks">
              {WEEKDAY_LABELS.map(({ dow, label }) => (
                <label key={dow} className={`rsm-day-check ${draft.weekdayOpenDays.includes(dow) ? 'rsm-day-check--active' : ''}`}>
                  <input type="checkbox" checked={draft.weekdayOpenDays.includes(dow)} onChange={() => toggleWeekday(dow)} />
                  {label}
                </label>
              ))}
            </div>
          </section>

          {/* 4. Notice Period */}
          <section className="rsm-section">
            <h3 className="rsm-section-title"><Lock size={16} /> זמן התרעה מראש</h3>
            <p className="rsm-section-hint">באותו יום, מאיזו שעה המערכת תסגור אוטומטית ימים שלא הוזמנו?</p>
            <div className="rsm-notice-row">
              <label className="rsm-notice-label">חסום אוטומטית לאחר שעה:</label>
              <select className="rsm-notice-select" value={draft.noticeCutoffHour}
                onChange={(e) => setDraft((p) => ({ ...p, noticeCutoffHour: Number(e.target.value) }))}>
                {[8, 10, 12, 14, 16, 18, 24].map((h) => (
                  <option key={h} value={h}>{h === 24 ? 'לא חוסם (כל שעה)' : `${h}:00`}</option>
                ))}
              </select>
            </div>
          </section>

          {/* 5. Calendar Sync Placeholder */}
          <section className="rsm-section">
            <h3 className="rsm-section-title">📆 סנכרון יומן אישי</h3>
            <div className="rsm-sync-card">
              <div className="rsm-sync-info">
                <p className="rsm-sync-title">Google Calendar / Apple Calendar</p>
                <p className="rsm-sync-desc">סנכרון דו-כיווני יזהה אוטומטית אירועים אישיים ויסגור תאריכים בהתאם</p>
              </div>
              <div className="rsm-coming-soon-wrapper">
                <button id="rsm-sync-btn" className="rsm-sync-btn" disabled title="פיצ'ר זה בפיתוח">
                  🔗 חבר יומן
                </button>
                <span className="rsm-coming-soon-badge">בקרוב</span>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="rsm-modal-footer">
          <button id="rsm-cancel" className="rsm-btn-cancel" onClick={handleClose}>ביטול</button>
          <button id="rsm-save" className="rsm-btn-save" onClick={handleSave}>שמור הגדרות</button>
        </div>

      </div>
    </div>
  );
}
