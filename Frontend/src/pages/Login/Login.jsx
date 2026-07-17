import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Send authentication request to your FastAPI backend
      // Adjust this URL to match your backend's login endpoint
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email: email,
        password: password,
      });

      // 2. Save the access token securely in the browser
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        
        // 3. Callback to app.jsx to let it know to refetch the logged-in user profile
        if (onLoginSuccess) {
          await onLoginSuccess();
        }

        // 4. Redirect the user back to the main page
        navigate('/');
      } else {
        setError('שגיאה בקבלת מפתח התחברות מהשרת.');
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail); // Show specific error from FastAPI
      } else {
        setError('כתובת אימייל או סיסמה שגויים. אנא נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-section">
          {/* Blue Shield Icon (Matches your navbar logo) */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#1d4ed8" className="login-shield-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2>שבת שלום</h2>
          <p>התחברות למערכת אירוח חיילים</p>
        </div>

        {error && <div className="login-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">כתובת אימייל</label>
            <input
              type="email"
              id="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              type="password"
              id="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>

        <div className="login-footer">
          <span>אין לך חשבון עדיין? </span>
          <span className="signup-link" onClick={() => navigate('/signup')}>הרשם כאן</span>
        </div>
      </div>
    </div>
  );
}