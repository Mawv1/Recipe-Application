import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Auth.css';

function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error('Błędny email lub hasło');

      const data = await res.json();

      if (!data.access_token) {
        throw new Error('Serwer nie zwrócił tokena uwierzytelniającego');
      }

      // Wyczyść wszelkie istniejące tokeny przed ustawieniem nowego
      localStorage.removeItem('token');

      // Zapisz token w localStorage
      localStorage.setItem('token', data.access_token);

      // Zapisz też refresh token jeśli istnieje
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Informuj aplikację o zmianie stanu uwierzytelnienia
      window.dispatchEvent(new Event('tokenChange'));

      // Przekierowanie na stronę główną
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>{t('login')}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
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
        <button type="submit">{t('login')}</button>
      </form>
      <p>
        {t('noAccount', 'Nie masz konta?')}{' '}
        <span className="auth-link" onClick={() => navigate('/register')}>{t('register')}</span>
      </p>
    </div>
  );
}

export default Login;

