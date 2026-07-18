import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/api';
import { Logo, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../components/Common/Icons';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send authentication request using central authApi
      await authApi.login({
        username: email,
        password: password,
      });

      // Callback to App.jsx to update authentication state
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Redirect the user back to the main page
      navigate('/');
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
          {/* Logo */}
          <Logo size={76} className="login-logo" />
          <h2>שבת שלום</h2>
          <p className="login-subtitle">אירוח חיילים לשבת</p>
        </div>

        {/* Tab Toggle Bar */}
        <div className="login-tabs-container">
          <button type="button" className="login-tab active">
            התחברות
          </button>
          <button type="button" className="login-tab" onClick={() => navigate('/signup')}>
            הרשמה
          </button>
        </div>

        {error && <div className="login-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email or Phone Field */}
          <div className="form-group-clean">
            <div className="input-icon-wrapper">
              <input
                type="text"
                required
                placeholder="אימייל או טלפון"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="clean-input"
              />
              <MailIcon size={18} className="inner-input-icon" />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group-clean">
            <div className="input-icon-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="סיסמה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="clean-input"
              />
              <LockIcon size={18} className="inner-input-icon" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                tabIndex="-1"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>

      <div className="login-outside-footer">
        בהתחברות אתה מסכים לתנאי השימוש ומדיניות הפרטיות
      </div>
    </div>
  );
}