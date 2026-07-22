import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FindHost.css';

export default function FindHost() {
  const [hosts, setHosts] = useState([]);
  const [searchCity, setSearchCity] = useState('');
  const [kashrutFilter, setKashrutFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // מדמה שליפת מארחים מה-API (או שימוש במוק דאטה שיצרנו)
  useEffect(() => {
    // כאן בעתיד תתבצע קריאת axios.get('http://localhost:8000/api/hosts')
    // כרגע נשתמש ברשימה מדומה מבוססת על המוק דאטה שלך
    const mockHosts = [
      { id: 1, full_name: "מוטי כהן", city: "תל אביב", kashrut_level: "KOSHER", biography: "נשמח מאוד לארח חיילים וסטודנטים לסופי שבוע חמים, ארוחות שבת חגיגיות ואווירה משפחתית שמחה בביתנו." },
      { id: 2, full_name: "מיכל ואלון לוי", city: "ירושלים", kashrut_level: "MEHADRIN", biography: "משפחה חמה בירושלים. הבית שלנו תמיד פתוח לחיילים בודדים ולמי שצריך פינה שקטה וארוחה טובה בסופש." },
      { id: 3, full_name: "דוד ואסתר מזרחי", city: "חיפה", kashrut_level: "KOSHER", biography: "גרים בצפון, ההורים של כולם. יש לנו יחידת אירוח נפרדת ומפנקת שמתאימה מאוד ללוחמים שיוצאים מהגלזורה." },
      { id: 4, full_name: "רחל גולדשטיין", city: "בני ברק", kashrut_level: "MEHADRIN", biography: "אירוח באווירה חרדית/דתית לאומית, כשרות למהדרין מן המהדרין. שפע של אוכל דברי תורה ואווירה רוחנית." }
    ];
    setHosts(mockHosts);
  }, []);

  const handleBookingRequest = (hostId, hostName) => {
    setSuccessMessage(`בקשת האירוח נשלחה בהצלחה אל ${hostName}! הודעת קוד תשלח אליך בקרוב.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // סינון מארחים לפי קלט המשתמש
  const filteredHosts = hosts.filter(host => {
    const matchesCity = host.city.toLowerCase().includes(searchCity.toLowerCase());
    const matchesKashrut = kashrutFilter === 'ALL' || host.kashrut_level === kashrutFilter;
    return matchesCity && matchesKashrut;
  });

  return (
    <div className="find-host-page">

      {/* אזור תוכן ראשי */}
      <main className="dashboard-content">
        <header className="content-header">
          <h2>מצא מארח לסוף השבוע</h2>
          <p>מערכת חיבור ותיאום אירוח לחיילים בודדים וללוחמים בסופי שבוע</p>
        </header>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {/* בר סינון וחיפוש */}
        <div className="search-bar-container">
          <div className="input-group">
            <label>חפש לפי עיר או יישוב:</label>
            <input
              type="text"
              placeholder="לדוגמה: ירושלים, תל אביב..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>רמת כשרות:</label>
            <select value={kashrutFilter} onChange={(e) => setKashrutFilter(e.target.value)}>
              <option value="ALL">הכל חצי</option>
              <option value="KOSHER">כשר</option>
              <option value="MEHADRIN">כשר למהדרין</option>
            </select>
          </div>
        </div>

        {/* גריד כרטיסיות מארחים */}
        <div className="hosts-grid">
          {filteredHosts.length > 0 ? (
            filteredHosts.map((host) => (
              <div className="host-card" key={host.id}>
                <div className="card-header">
                  <h3>{host.full_name}</h3>
                  <span className="badge badge-location">{host.city}</span>
                </div>
                <div className="card-body">
                  <p>{host.biography}</p>
                  <div className="kashrut-info">
                    <strong>רמת כשרות:</strong> {host.kashrut_level === 'MEHADRIN' ? 'מהדרין' : 'כשר'}
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    className="book-now-btn"
                    onClick={() => handleBookingRequest(host.id, host.full_name)}
                  >
                    שלח בקשת אירוח
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">לא נמצאו מארחים התואמים את אפשרויות הסינון שלך.</div>
          )}
        </div>
      </main>
    </div>
  );
}
