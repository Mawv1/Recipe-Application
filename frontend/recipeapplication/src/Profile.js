import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState('checking');
  const navigate = useNavigate();

  // Stany dla edycji profilu
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Stan dla zmiany hasła
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Funkcja do pobierania ulubionych przepisów bezpośrednio z API
  const fetchFollowedRecipes = async (userId, token) => {
    try {
      // Pobierz ulubione przepisy z API
      console.log('Próbuję pobrać ulubione przepisy z /api/v1/users/me/followed-recipes');

      const recipesResponse = await fetch(
        'http://localhost:8080/api/v1/users/me/followed-recipes',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Status odpowiedzi z /users/me/followed-recipes:', recipesResponse.status);

      if (recipesResponse.ok) {
        const data = await recipesResponse.json();
        console.log('Pobrano ulubione przepisy z /users/me/followed-recipes:', data);
        return data.content || data;
      }

      // Jako alternatywę, spróbujmy użyć endpointu z ID użytkownika
      console.log(`Próbuję pobrać przepisy z /api/v1/users/${userId}/followed-recipes`);

      const fallbackResponse = await fetch(
        `http://localhost:8080/api/v1/users/${userId}/followed-recipes`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Status odpowiedzi z /users/id/followed-recipes:', fallbackResponse.status);

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        console.log('Pobrano przepisy z /users/id/followed-recipes:', data);
        return data.content || data;
      }

      // Jeśli nic nie znaleźliśmy, zwróć pustą tablicę
      return [];

    } catch (err) {
      console.error('Błąd podczas pobierania ulubionych przepisów:', err);
      return [];
    }
  };

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
                setEditedUser(userData); // Inicjalizacja stanu do edycji
                setAuthState('authenticated');
              }

              // Pobierz ulubione przepisy
              const followedRecipes = await fetchFollowedRecipes(userData.id, token);
              if (isMounted) {
                setRecipes(followedRecipes);
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

  // Funkcja odświeżająca listę ulubionych przepisów
  const refreshFollowedRecipes = async () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // Pobierz świeże dane
      const followedRecipes = await fetchFollowedRecipes(user.id, token);
      setRecipes(followedRecipes);
      showNotification('success', t('recipesRefreshed', 'Lista przepisów została odświeżona!'));
    } catch (err) {
      console.error('Błąd podczas odświeżania przepisów:', err);
      showNotification('error', t('recipesRefreshError', 'Wystąpił błąd podczas odświeżania przepisów.'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('tokenChange'));
    navigate('/login');
  };

  // Obsługa edycji profilu
  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedUser(user); // Przywrócenie oryginalnych wartości
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Funkcja do zapisywania zmian w profilu
  const handleSaveProfile = async () => {
    if (!user || !editedUser) return;

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:8080/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          email: editedUser.email
        })
      });

      if (!response.ok) {
        throw new Error(`Błąd podczas aktualizacji profilu: ${response.status}`);
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditingProfile(false);
      showNotification('success', t('profileUpdated', 'Profil został zaktualizowany pomyślnie!'));
    } catch (err) {
      console.error('Błąd podczas aktualizacji profilu:', err);
      showNotification('error', err.message || t('profileUpdateError', 'Wystąpił błąd podczas aktualizacji profilu.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Funkcja do zmiany hasła
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', t('passwordsDoNotMatch', 'Nowe hasło i potwierdzenie hasła nie są identyczne!'));
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      // Poprawne kodowanie parametrów w URL
      const oldPasswordEncoded = encodeURIComponent(passwordData.currentPassword);
      const newPasswordEncoded = encodeURIComponent(passwordData.newPassword);

      const endpoint = `http://localhost:8080/api/v1/users/${user.id}/password?oldPassword=${oldPasswordEncoded}&newPassword=${newPasswordEncoded}`;
      console.log('Wysyłam żądanie zmiany hasła:', endpoint.replace(/oldPassword=.*&newPassword=/, 'oldPassword=[HIDDEN]&newPassword='));

      // Upewnij się, że nagłówki są poprawne
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Dla debugowania - sprawdź, czy token jest prawidłowy
      console.log('Token JWT (pierwsze 20 znaków):', token ? token.substring(0, 20) + '...' : 'brak tokenu');

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: headers,
        credentials: 'include'
      });

      console.log('Status odpowiedzi z serwera:', response.status);

      if (!response.ok) {
        let errorMessage = '';

        // Próba pobrania komunikatu błędu z odpowiedzi
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || '';
          console.log('Odpowiedź z serwera:', errorData);
        } catch (jsonError) {
          console.log('Nie udało się sparsować odpowiedzi jako JSON:', jsonError);
          // Próba pobrania tekstu odpowiedzi
          try {
            errorMessage = await response.text();
            console.log('Odpowiedź tekstowa z serwera:', errorMessage);
          } catch (textError) {
            console.log('Nie udało się pobrać tekstu odpowiedzi:', textError);
          }
        }

        if (response.status === 403) {
          throw new Error(t('unauthorized', 'Brak uprawnień do zmiany hasła. Upewnij się, że jesteś zalogowany.'));
        } else if (response.status === 401) {
          throw new Error(t('incorrectCurrentPassword', 'Obecne hasło jest niepoprawne!'));
        } else if (errorMessage) {
          throw new Error(errorMessage);
        } else {
          throw new Error(`${t('passwordChangeError', 'Błąd podczas zmiany hasła')}: ${response.status}`);
        }
      }

      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotification('success', t('passwordChanged', 'Hasło zostało zmienione pomyślnie!'));
    } catch (err) {
      console.error('Błąd podczas zmiany hasła:', err);
      showNotification('error', err.message || t('passwordChangeError', 'Wystąpił błąd podczas zmiany hasła.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Funkcja do wyświetlania powiadomień
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 5000);
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
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">{t('profile', 'Profil użytkownika')}</h2>
        <div className="profile-actions">
          <button className="profile-button secondary" onClick={refreshFollowedRecipes}>
            {t('refreshRecipes', 'Odśwież przepisy')}
          </button>
          <button className="profile-button danger" onClick={handleLogout}>
            {t('logout', 'Wyloguj się')}
          </button>
        </div>
      </div>

      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="profile-sections">
        <div className="profile-section">
          <div className="section-header">
            <h3 className="section-title">{t('personalInfo', 'Dane osobowe')}</h3>
            {!isEditingProfile && (
              <button className="profile-button" onClick={handleProfileEdit}>
                {t('edit', 'Edytuj')}
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="section-content">
              <div className="info-row">
                <div className="info-label">{t('firstName', 'Imię')}:</div>
                <div className="info-value">{user.firstName}</div>
              </div>
              <div className="info-row">
                <div className="info-label">{t('lastName', 'Nazwisko')}:</div>
                <div className="info-value">{user.lastName}</div>
              </div>
              <div className="info-row">
                <div className="info-label">{t('email', 'Email')}:</div>
                <div className="info-value">{user.email}</div>
              </div>

              <button
                className="profile-button secondary"
                style={{ marginTop: '20px' }}
                onClick={() => setIsChangingPassword(true)}
              >
                {t('changePassword', 'Zmień hasło')}
              </button>
            </div>
          ) : (
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="firstName">{t('firstName', 'Imię')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-control"
                  value={editedUser.firstName || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('lastName', 'Nazwisko')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-control"
                  value={editedUser.lastName || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">{t('email', 'Email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={editedUser.email || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  className="profile-button secondary"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  {t('cancel', 'Anuluj')}
                </button>
                <button
                  className="profile-button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? <span className="loading-spinner"></span> : t('save', 'Zapisz')}
                </button>
              </div>
            </div>
          )}

          {isChangingPassword && (
            <div className="edit-form">
              <h4>{t('changePassword', 'Zmiana hasła')}</h4>
              <div className="form-group">
                <label htmlFor="currentPassword">{t('currentPassword', 'Obecne hasło')}</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className="form-control"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">{t('newPassword', 'Nowe hasło')}</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t('confirmPassword', 'Potwierdź nowe hasło')}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  className="profile-button secondary"
                  onClick={() => setIsChangingPassword(false)}
                  disabled={isSaving}
                >
                  {t('cancel', 'Anuluj')}
                </button>
                <button
                  className="profile-button"
                  onClick={handleChangePassword}
                  disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {isSaving ? <span className="loading-spinner"></span> : t('changePassword', 'Zmień hasło')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="section-header">
            <h3 className="section-title">{t('followedRecipes', 'Ulubione przepisy')}</h3>
          </div>

          {recipes.length === 0 ? (
            <p>{t('noFollowedRecipes', 'Brak obserwowanych przepisów.')}</p>
          ) : (
            <div className="recipes-grid">
              {recipes.map(recipe => (
                <div
                  key={recipe.id || recipe.recipeId}
                  className="recipe-card"
                  onClick={() => navigate(`/recipes/${recipe.recipeId}`)}
                >
                  <div
                    className="recipe-image"
                    style={{ backgroundColor: '#f0f0f0' }} // Placeholder dla obrazka
                  />
                  <div className="recipe-body">
                    <h4 className="recipe-title">{recipe.title || recipe.recipeTitle}</h4>
                    {recipe.description && (
                      <p className="recipe-description">
                        {recipe.description.length > 100
                          ? `${recipe.description.substring(0, 100)}...`
                          : recipe.description}
                      </p>
                    )}
                    <div className="recipe-footer">
                      <span>{t('clickForDetails', 'Kliknij, aby zobaczyć szczegóły')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
