import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from '../../components/Common/Icons';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  // Reverted key back to 'username' to satisfy the backend schema
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fieldsConfig = [
    {
      id: 'username', // Changed back to 'username'
      label: 'כתובת אימייל',
      type: 'email',
      placeholder: 'name@example.com',
    },
    {
      id: 'password',
      label: 'סיסמה',
      type: 'password',
      placeholder: '••••••••',
    }
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
      // Sends payload containing { username, password }
      const response = await axios.post('http://localhost:8000/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        if (onLoginSuccess) {
          await onLoginSuccess();
        }
        
        navigate('/');
      } else {
        setError('שגיאה בקבלת מפתח התחברות מהשרת.');
      }
    } catch (err) {
      console.error("Login request failed:", err);
      
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          const parsedErrors = detail.map(errObj => `${errObj.loc[1] || 'קלט'}: ${errObj.msg}`).join(', ');
          setError(parsedErrors);
        } else {
          setError('נתונים לא תקינים נשלחו לשרת.');
        }
      } else {
        setError('כתובת אימייל או סיסמה שגויים. אנא נסה שוב.');
      }
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
        <div className="login-header">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#1d4ed8" className="login-shield-icon">
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