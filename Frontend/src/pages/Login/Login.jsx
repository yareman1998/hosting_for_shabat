import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from '../../components/Common/Icons';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize theme from localStorage, default to light mode
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const navigate = useNavigate();
  const location = useLocation();

  const isLoginActive = location.pathname === '/login' || location.pathname === '/';

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

  const fieldsConfig = [
    { id: 'username', label: 'כתובת אימייל', type: 'email', placeholder: 'name@example.com' },
    { id: 'password', label: 'סיסמה', type: 'password', placeholder: '••••••••' }
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        if (onLoginSuccess) await onLoginSuccess();
        navigate('/');
      }
    } catch (err) {
      setError('כתובת אימייל או סיסמה שגויים.');
    } finally {
      setLoading(false);
    }
  };

  function renderFields() {
    return fieldsConfig.map((field) => (
      <div className="form-group" key={field.id}>
        <label htmlFor={field.id}>{field.label}</label>
        {field.id === 'password' ? (
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id={field.id}
              required
              placeholder={field.placeholder}
              value={formData[field.id]}
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
        ) : (
          <input
            type={field.type}
            id={field.id}
            required
            placeholder={field.placeholder}
            value={formData[field.id]}
            onChange={handleChange}
          />
        )}
      </div>
    ));
  }

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
          <h2>שבת שלום</h2>
          <p>מערכת אירוח חיילים בסופי שבוע</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {renderFields()}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>

        <div className="login-footer">
          <span>אין לך חשבון עדיין?</span>
          <span className="signup-link" onClick={() => navigate('/register')}>הרשמה כאן</span>
        </div>
      </div>
    </div>
  );
}