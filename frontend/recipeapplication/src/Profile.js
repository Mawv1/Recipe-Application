import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AuthService from './AuthService';
import './Auth.css';

function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState('checking');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // Funkcja sprawdzająca czy użytkownik jest zalogowany i pobierająca jego dane
    const checkAuthAndLoadProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          if (isMounted) {
            setAuthState('unauthenticated');
            setError("Musisz się zalogować, aby zobaczyć swój profil");
            setLoading(false);
          }
          navigate('/login');
          return;
        }

        try {
          const parts = token.split('.');

          if (parts.length === 3) {
            try {
              // Dekodowanie JWT
              const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              const padding = '='.repeat((4 - base64.length % 4) % 4);
              const decodedPayload = JSON.parse(atob(base64 + padding));

              // Użyj emaila z tokena
              const email = decodedPayload.sub;
              if (!email) {
                throw new Error("Brak emaila w tokenie");
              }

              // Pobierz dane użytkownika po emailu
              const userResponse = await fetch(
                `http://localhost:8080/api/v1/users/email/${encodeURIComponent(email)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );

              if (!userResponse.ok) {
                if (userResponse.status === 401 || userResponse.status === 403) {
                  throw new Error("Sesja wygasła. Zaloguj się ponownie.");
                } else {
                  throw new Error(`Błąd pobierania danych użytkownika: ${userResponse.status}`);
                }
              }

              const userData = await userResponse.json();
              if (isMounted) {
                setUser(userData);
                setAuthState('authenticated');
              }

              // Pobierz obserwowane przepisy
              try {
                const recipesResponse = await fetch(
                  `http://localhost:8080/api/v1/users/${userData.id}/followed-recipes`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (recipesResponse.ok) {
                  const recipesData = await recipesResponse.json();
                  if (isMounted) setRecipes(recipesData || []);
                }
              } catch (err) {
                // Ignorujemy błędy przepisów - nie są krytyczne
              }
            } catch (decodeError) {
              throw new Error("Nieprawidłowy format tokena. Zaloguj się ponownie.");
            }
          } else {
            throw new Error("Nieprawidłowy format tokena. Zaloguj się ponownie.");
          }
        } catch (tokenError) {
          localStorage.removeItem('token');
          if (isMounted) {
            setAuthState('error');
            setError("Problem z autoryzacją. Zaloguj się ponownie.");
          }
          navigate('/login');
          return;
        }
      } catch (err) {
        localStorage.removeItem('token');
        if (isMounted) {
          setAuthState('error');
          setError(err.message || "Wystąpił nieznany błąd");
        }
        navigate('/login');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuthAndLoadProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, t]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('tokenChange'));
    navigate('/login');
  };

  if (loading) {
    return <div className="loading-text">{t('loading', 'Ładowanie profilu...')}</div>;
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="error-text">{error}</div>
        <button className="auth-form button" onClick={() => navigate('/login')}>
          {t('backToLogin', 'Wróć do logowania')}
        </button>
      </div>
    );
  }

  if (authState !== 'authenticated' || !user) {
    return (
      <div className="auth-container">
        <div className="error-text">{t('profileNotAvailable', 'Profil niedostępny. Zaloguj się, aby kontynuować.')}</div>
        <button className="auth-form button" onClick={() => navigate('/login')}>
          {t('login', 'Zaloguj się')}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>{t('profile', 'Profil użytkownika')}</h2>
      <div style={{marginBottom: '18px'}}>
        <strong>{t('firstName', 'Imię')}:</strong> {user.firstName}<br/>
        <strong>{t('lastName', 'Nazwisko')}:</strong> {user.lastName}<br/>
        <strong>{t('email', 'Email')}:</strong> {user.email}
      </div>
      <button className="auth-form button" onClick={handleLogout}>{t('logout', 'Wyloguj się')}</button>
      <h3 style={{marginTop: '32px'}}>{t('followedRecipes', 'Obserwowane przepisy')}</h3>
      {recipes.length === 0 ? (
        <p>{t('noFollowedRecipes', 'Brak obserwowanych przepisów.')}</p>
      ) : (
        <ul style={{paddingLeft: 0, listStyle: 'none'}}>
          {recipes.map(recipe => (
            <li key={recipe.id} className="recipe-item" style={{marginBottom: '16px'}}>
              <strong>{recipe.title}</strong><br/>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Profile;
