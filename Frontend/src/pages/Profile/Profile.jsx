import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Controls View vs Edit modes
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(response.data);
        setProfileData(response.data.profile || {});
      } catch (err) {
        console.error("Failed to load profile:", err);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const token = localStorage.getItem('token');
    const endpoint = user.user_type === 'host' 
      ? 'http://localhost:8000/api/auth/profile/host'
      : 'http://localhost:8000/api/auth/profile/guest';

    try {
      await axios.put(endpoint, profileData, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });
      setMessage({ type: 'success', text: 'הפרופיל עודכן בהצלחה!' });
      setIsEditing(false); // Switch back to read-only view on success
    } catch (err) {
      setMessage({ type: 'error', text: 'שגיאה בעדכון הפרופיל. נסה שוב.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-logout')); // Hooks directly into useAppLogic
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-screen">טוען פרופיל...</div>
      </div>
    );
  }

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : '';

  return (
    <div className="profile-container">
      <div className="profile-card">
        
        {!isEditing ? (
          /* ================= VIEW MODE ================= */
          <>
            <h1 className="page-title">הפרופיל שלי</h1>
            
            <div className="profile-hero">
              <div className="hero-top">
                <div className="hero-avatar">{userInitial}</div>
                <div className="hero-info">
                  <h3>{user.full_name}</h3>
                  <p>{user.user_type === 'guest' ? profileData.unit_name || 'טרם עודכנה יחידה' : profileData.city || 'טרם עודכנה עיר'}</p>
                </div>
                <div className="hero-role">
                  {user.user_type === 'host' ? 'משפחה מארחת' : 'חייל/ת (אורח)'}
                </div>
              </div>
              
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-value">0</span>
                  <span className="stat-label">אירוחים</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">0</span>
                  <span className="stat-label">מארחים</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">0</span>
                  <span className="stat-label">לינות</span>
                </div>
              </div>
            </div>

            <div className="details-card">
              <div className="details-header">
                {user.user_type === 'host' ? 'פרופיל מארח [host_profile]' : 'פרופיל אורח [guest_profile]'}
              </div>
              
              <div className="detail-row">
                <span className="detail-label">אימייל</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">טלפון</span>
                <span className="detail-value" dir="ltr">{user.phone_number}</span>
              </div>

              {user.user_type === 'guest' && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">יחידה / בסיס</span>
                    <span className="detail-value">{profileData.unit_name || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">עיר מוצא</span>
                    <span className="detail-value">{profileData.origin_city || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">העדפות / אלרגיות</span>
                    <span className="detail-value">{profileData.food_preferences_allergies || 'אין'}</span>
                  </div>
                </>
              )}

              {user.user_type === 'host' && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">עיר מגורים</span>
                    <span className="detail-value">{profileData.city || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">רמת כשרות</span>
                    <span className="detail-value">{profileData.kashrut_level === 'GLATT_KOSHER' ? 'למהדרין' : profileData.kashrut_level === 'NOT_KOSHER' ? 'לא שומרים' : 'כשר'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">מקסימום מתארחים</span>
                    <span className="detail-value">{profileData.max_guests || 1}</span>
                  </div>
                </>
              )}
            </div>

            <div className="profile-footer-actions">
              <button className="btn-outline btn-logout" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                יציאה
              </button>
              <button className="btn-outline" onClick={() => setIsEditing(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                עריכת פרופיל
              </button>
            </div>
          </>
        ) : (
          /* ================= EDIT MODE ================= */
          <>
            <div className="profile-header">
              <h2>עריכת פרופיל</h2>
              <p>עדכן את הפרטים האישיים שלך</p>
            </div>

            {message.text && (
              <div className="login-error" style={{
                backgroundColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : '',
                color: message.type === 'success' ? '#4ade80' : '',
                borderColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.2)' : ''
              }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="profile-form-grid">
                
                {user.user_type === 'host' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="city">עיר מגורים</label>
                      <input type="text" id="city" value={profileData.city || ''} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="neighborhood">שכונה (אופציונלי)</label>
                      <input type="text" id="neighborhood" value={profileData.neighborhood || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="max_guests">כמות מתארחים מקסימלית</label>
                      <input type="number" id="max_guests" min="1" value={profileData.max_guests || 1} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="kashrut_level">רמת כשרות בבית</label>
                      <select id="kashrut_level" value={profileData.kashrut_level || 'KOSHER'} onChange={handleChange}>
                        <option value="KOSHER">כשר</option>
                        <option value="GLATT_KOSHER">גלאט כשר / למהדרין</option>
                        <option value="NOT_KOSHER">ללא תעודה / לא מקפידים</option>
                      </select>
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="free_text_notes">הערות נוספות למתארחים</label>
                      <textarea id="free_text_notes" rows="3" value={profileData.free_text_notes || ''} onChange={handleChange} />
                    </div>
                  </>
                )}

                {user.user_type === 'guest' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="origin_city">עיר מגורים (מקור)</label>
                      <input type="text" id="origin_city" value={profileData.origin_city || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="unit_name">שם יחידה / בסיס</label>
                      <input type="text" id="unit_name" value={profileData.unit_name || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="food_preferences_allergies">העדפות מזון / אלרגיות</label>
                      <input type="text" id="food_preferences_allergies" placeholder="צמחוני, אלרגיה לבוטנים..." value={profileData.food_preferences_allergies || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="skills_give_take">קצת עלייך (תחביבים, כישורים)</label>
                      <textarea id="skills_give_take" rows="3" value={profileData.skills_give_take || ''} onChange={handleChange} />
                    </div>
                  </>
                )}
              </div>

              <div className="profile-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn-outline" style={{ padding: '12px 24px' }} onClick={() => setIsEditing(false)}>
                  ביטול
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}