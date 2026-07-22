import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from '../../components/Common/Icons';
import '../Login/Login.css';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    user_type: 'guest'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize theme from localStorage
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const navigate = useNavigate();
  const location = useLocation();

  const isLoginActive = location.pathname === '/login';

  // Synchronize layout dark-theme classes
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password && formData.confirm_password && formData.password !== formData.confirm_password) {
      setError('הסיסמאות אינן תואמות.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        user_type: formData.user_type
      };

      const response = await axios.post('http://localhost:8000/api/auth/register', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 201 || response.status === 200) {
        setSuccess('ההרשמה בוצעה בהצלחה! מעביר אותך להתחברות...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError('הרשמה נכשלה. אנא ודא שהפרטים אינם רשומים כבר במערכת.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Floating Theme Switcher Button */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "מצב בהיר" : "מצב כהה"}
        >
          {isDark ? (
            <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" fill="#eab308" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#64748b" />
            </svg>
          )}
        </button>

        {/* Navigation Switcher Pill */}
        <div className="auth-toggle-wrapper">
          <div className="auth-toggle-pill">
            <button
              type="button"
              className={`toggle-arrow ${!isLoginActive ? 'disabled' : ''}`}
              onClick={() => navigate('/register')}
              disabled={!isLoginActive}
            >
              ‹
            </button>
            <div className="toggle-options-container">
              <button
                type="button"
                className={`toggle-btn-option ${!isLoginActive ? 'active' : ''}`}
                onClick={() => navigate('/register')}
              >
                הרשמה
              </button>
              <button
                type="button"
                className={`toggle-btn-option ${isLoginActive ? 'active' : ''}`}
                onClick={() => navigate('/login')}
              >
                התחברות
              </button>
            </div>
            <button
              type="button"
              className={`toggle-arrow ${isLoginActive ? 'disabled' : ''}`}
              onClick={() => navigate('/login')}
              disabled={isLoginActive}
            >
              ›
            </button>
          </div>
        </div>

        <div className="login-header">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#2563eb" className="login-shield-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2>יצירת חשבון חדש</h2>
          <p>הצטרף למערכת אירוח החיילים בסופי שבוע</p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && (
          <div
            style={{
              color: '#4ade80',
              backgroundColor: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              textAlign: 'center',
              fontSize: '14px'
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="full_name">שם מלא</label>
            <input
              type="text"
              id="full_name"
              required
              placeholder="ישראל ישראלי"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">כתובת אימייל</label>
            <input
              type="email"
              id="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">מספר טלפון</label>
            <input
              type="tel"
              id="phone_number"
              required
              placeholder="0501234567"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">אימות סיסמה</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                required
                placeholder="הקלד שוב את הסיסמה"
                value={formData.confirm_password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="user_type">אני רוצה להיות...</label>
            <select id="user_type" value={formData.user_type} onChange={handleChange}>
              <option value="guest">חייל/ת (אורח)</option>
              <option value="host">משפחה מארחת</option>
            </select>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'מבצע הרשמה...' : 'הרשמה'}
          </button>
        </form>

        <div className="login-footer">
          <span>כבר יש לך חשבון?</span>
          <span className="signup-link" onClick={() => navigate('/login')}>התחבר כאן</span>
        </div>
      </div>
    </div>
  );
}