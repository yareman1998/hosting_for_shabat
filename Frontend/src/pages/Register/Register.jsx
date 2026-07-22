import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from '../../components/Common/Icons';
import './Register.css';

export default function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    user_type: 'guest',
    biography: ''
  });

  const fieldsConfig = [
    { id: 'full_name', label: 'שם מלא', type: 'text', placeholder: 'ישראל ישראלי' },
    { id: 'email', label: 'כתובת אימייל', type: 'email', placeholder: 'name@example.com' },
    { id: 'phone_number', label: 'מספר טלפון', type: 'tel', placeholder: '050-1234567' },
    { id: 'password', label: 'סיסמה', type: 'password', placeholder: 'לפחות 8 תווים, אות גדולה וספרה' },
    { id: 'confirm_password', label: 'אימות סיסמה', type: 'password', placeholder: 'הקלד שוב את הסיסמה' }
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, user_type: role }));
  };

  // Pre-validates the fields to perfectly align with your backend Pydantic checks
  const validateClientSide = () => {
    const { password, confirm_password } = formData;

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל 8 תווים לפחות.');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('הסיסמה חייבת להכיל לפחות אות גדולה אחת באנגלית (A-Z).');
      return false;
    }
    if (!/\d/.test(password)) {
      setError('הסיסמה חייבת להכיל לפחות ספרה אחת (0-9).');
      return false;
    }
    if (password !== confirm_password) {
      setError('הסיסמאות אינן תואמות.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Trigger local Pydantic mirror check
    if (!validateClientSide()) return;

    setLoading(true);

    try {
      // 1. Create a filtered payload containing only what the base schema expects
      const registrationPayload = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        user_type: formData.user_type,
        phone_number: formData.phone_number
      };

      // 2. Send registrationPayload instead of the full formData object
      const response = await axios.post('http://localhost:8000/api/auth/register', registrationPayload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 201 || response.status === 200) {
        navigate('/login');
      }
    } catch (err) {
      console.error("Signup failed:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('נכשלנו ברישום המשתמש. אנא בדוק את תקינות הנתונים.');
      }
    } finally {
      setLoading(false);
    }
  };

  function renderFields() {
    return fieldsConfig.map((field) => {
      const isPassword = field.id === 'password';
      const isConfirmPassword = field.id === 'confirm_password';
      const isPasswordField = isPassword || isConfirmPassword;

      if (isPasswordField) {
        const isVisible = isPassword ? showPassword : showConfirmPassword;
        const toggleVisibility = () => {
          if (isPassword) {
            setShowPassword((prev) => !prev);
          } else {
            setShowConfirmPassword((prev) => !prev);
          }
        };

        return (
          <div className="form-group" key={field.id}>
            <label htmlFor={field.id}>{field.label}</label>
            <div className="password-input-wrapper">
              <input
                type={isVisible ? 'text' : 'password'}
                id={field.id}
                required
                placeholder={field.placeholder}
                value={formData[field.id]}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleVisibility}
                aria-label={isVisible ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {isVisible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="form-group" key={field.id}>
          <label htmlFor={field.id}>{field.label}</label>
          <input
            type={field.type}
            id={field.id}
            required
            placeholder={field.placeholder}
            value={formData[field.id]}
            onChange={handleInputChange}
          />
        </div>
      );
    });
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="#1d4ed8" className="signup-shield-icon">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2>הרשמה למערכת</h2>
          <p>הצטרפו לקהילת שבת שלום לאירוח חיילים</p>
        </div>

        {error && <div className="signup-error">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label>סוג חשבון</label>
            <div className="role-selector-group">
              <button
                type="button"
                className={`role-btn ${formData.user_type === 'guest' ? 'active' : ''}`}
                onClick={() => handleRoleChange('guest')}
              >
                חייל / אורח
              </button>
              <button
                type="button"
                className={`role-btn ${formData.user_type === 'host' ? 'active' : ''}`}
                onClick={() => handleRoleChange('host')}
              >
                מארח לשבת
              </button>
            </div>
          </div>

          {renderFields()}

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? 'מבצע רישום...' : 'צור חשבון חדש'}
          </button>
        </form>

        <div className="signup-footer">
          <span>כבר יש לך חשבון?</span>
          <span className="login-link" onClick={() => navigate('/login')}>התחבר כאן</span>
        </div>
      </div>
    </div>
  );
}