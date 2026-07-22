import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/api';
import { Shield, Eye, EyeOff } from 'lucide-react';
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

  const navigate = useNavigate();
  const location = useLocation();

  const isLoginActive = location.pathname === '/login';

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

      await authApi.register(payload);

      setSuccess('ההרשמה בוצעה בהצלחה! מעביר אותך להתחברות...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('הרשמה נכשלה. אנא ודא שהפרטים אינם רשומים כבר במערכת.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Navigation Switcher Pill */}
        <div className="auth-toggle-wrapper">
          <div className="auth-toggle-pill">
            <div className="toggle-options-container" style={{ width: '100%' }}>
              <button
                type="button"
                className={`toggle-btn-option ${!isLoginActive ? 'active' : ''}`}
                onClick={() => navigate('/register')}
                style={{ flex: 1, textAlign: 'center' }}
              >
                הרשמה
              </button>
              <button
                type="button"
                className={`toggle-btn-option ${isLoginActive ? 'active' : ''}`}
                onClick={() => navigate('/login')}
                style={{ flex: 1, textAlign: 'center' }}
              >
                התחברות
              </button>
            </div>
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

          {/* Custom Pill Switcher for User Type */}
          <div className="form-group">
            <label>אני רוצה להיות...</label>
            <div className="auth-toggle-pill" style={{ marginTop: '4px' }}>
              <div className="toggle-options-container" style={{ width: '100%' }}>
                <button
                  type="button"
                  className={`toggle-btn-option ${formData.user_type === 'guest' ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, user_type: 'guest' }))}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  צבא / שירות לאומי
                </button>
                <button
                  type="button"
                  className={`toggle-btn-option ${formData.user_type === 'host' ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, user_type: 'host' }))}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  משפחה מארחת
                </button>
              </div>
            </div>
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