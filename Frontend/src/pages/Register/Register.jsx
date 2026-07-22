import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Sun, Moon, Shield, Eye, EyeOff } from 'lucide-react';
import './Register.css';

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
            <Sun className="theme-icon" size={24} color="#eab308" />
          ) : (
            <Moon className="theme-icon" size={24} color="#64748b" />
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
          <Shield size={48} color="#2563eb" className="login-shield-icon" fill="#2563eb" />
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
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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