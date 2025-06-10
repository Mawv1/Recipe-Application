import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Auth.css';

function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });
      if (!res.ok) throw new Error('Rejestracja nie powiodła się');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>{t('register')}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder={t('firstName', 'Imię')}
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t('lastName', 'Nazwisko')}
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('password', 'Hasło')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="error-text">{error}</div>}
        {success && <div className="success-text">{t('registerSuccess', 'Rejestracja udana!')}</div>}
        <button type="submit">{t('register')}</button>
      </form>
      <p>
        {t('haveAccount', 'Masz już konto?')}{' '}
        <span className="auth-link" onClick={() => navigate('/login')}>{t('login')}</span>
      </p>
    </div>
  );
}

export default Register;

