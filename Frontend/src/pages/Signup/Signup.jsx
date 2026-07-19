import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignUp.css';

export default function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    user_type: 'guest'
  });

  const fieldsConfig = [
    { id: 'full_name', label: 'שם מלא', type: 'text', placeholder: 'ישראל ישראלי' },
    { id: 'email', label: 'כתובת אימייל', type: 'email', placeholder: 'name@example.com' },
    { id: 'phone_number', label: 'מספר טלפון', type: 'tel', placeholder: '050-1234567' },
    { id: 'password', label: 'סיסמה', type: 'password', placeholder: 'לפחות 8 תווים, אות גדולה וספרה' }
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
    const { password } = formData;
    
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
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Trigger local Pydantic mirror check
    if (!validateClientSide()) return;

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/auth/signup', formData, {
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
    return fieldsConfig.map((field) => (
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
    ));
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