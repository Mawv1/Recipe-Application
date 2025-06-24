import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import './Profile.css';
import AuthorizedImage from './components/AuthorizedImage';

function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [userRecipes, setUserRecipes] = useState([]);
  const [userRecipesLoading, setUserRecipesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState('checking');
  const navigate = useNavigate();

  // Stany do obsługi paginacji przepisów użytkownika
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 6; // Ilość przepisów na stronę

  // Stany do obsługi paginacji ulubionych przepisów
  const [favCurrentPage, setFavCurrentPage] = useState(0);
  const [favTotalPages, setFavTotalPages] = useState(0);
  const [favTotalElements, setFavTotalElements] = useState(0);
  const [favRecipesLoading, setFavRecipesLoading] = useState(false);
  const favPageSize = 6; // Ilość ulubionych przepisów na stronę

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Stany do walidacji formularza hasła
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  // Walidacja hasła przy każdej zmianie
  useEffect(() => {
    if (passwordData.newPassword) {
      const strength = {
        length: passwordData.newPassword.length >= 8,
        uppercase: /[A-Z]/.test(passwordData.newPassword),
        number: /[0-9]/.test(passwordData.newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)
      };
      setPasswordStrength(strength);

      if (passwordTouched.newPassword) {
        validateNewPassword();
      }
    }
  }, [passwordData.newPassword]);

  // Funkcje walidacyjne dla hasła
  const validateCurrentPassword = () => {
    if (!passwordData.currentPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: t('currentPasswordRequired', 'Obecne hasło jest wymagane')
      }));
      return false;
    }

    setPasswordErrors(prev => ({ ...prev, currentPassword: null }));
    return true;
  };

  const validateNewPassword = () => {
    if (!passwordData.newPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: t('newPasswordRequired', 'Nowe hasło jest wymagane')
      }));
      return false;
    }

    const allRequirementsMet =
      passwordStrength.length &&
      passwordStrength.uppercase &&
      passwordStrength.number &&
      passwordStrength.special;

    if (!allRequirementsMet) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: t('invalidPassword', 'Hasło nie spełnia wymagań bezpieczeństwa')
      }));
      return false;
    }

    setPasswordErrors(prev => ({ ...prev, newPassword: null }));
    return true;
  };

  const validateConfirmPassword = () => {
    if (!passwordData.confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: t('confirmPasswordRequired', 'Potwierdzenie hasła jest wymagane')
      }));
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: t('passwordsDoNotMatch', 'Hasła nie pasują do siebie')
      }));
      return false;
    }

    setPasswordErrors(prev => ({ ...prev, confirmPassword: null }));
    return true;
  };

  const validatePasswordForm = () => {
    const isCurrentPasswordValid = validateCurrentPassword();
    const isNewPasswordValid = validateNewPassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    return isCurrentPasswordValid && isNewPasswordValid && isConfirmPasswordValid;
  };

  const fetchFollowedRecipes = async (userId, token) => {
    try {
      const recipesResponse = await fetch(
        'http://localhost:8080/api/v1/users/me/followed-recipes',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (recipesResponse.ok) {
        const data = await recipesResponse.json();
        return data.content || data;
      }

      const fallbackResponse = await fetch(
        `http://localhost:8080/api/v1/users/${userId}/followed-recipes`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        return data.content || data;
      }

      return [];
    } catch (err) {
      setError(t('favoriteRecipesError'));
      setRecipes([]);
    }
  };

  const fetchFollowedRecipesWithPagination = async (userId, page = 0) => {
    if (!userId) return { content: [], totalPages: 0, totalElements: 0 };

    setFavRecipesLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return { content: [], totalPages: 0, totalElements: 0 };

    try {
      console.log(`[API] Pobieranie ulubionych przepisów dla strony ${page}, rozmiar strony: ${favPageSize}`);
      const url = `http://localhost:8080/api/v1/users/me/followed-recipes?page=${page}&size=${favPageSize}`;
      console.log(`[API] URL zapytania: ${url}`);

      const response = await fetch(
        url,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`[API] Status odpowiedzi: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('[API] Otrzymane dane ulubionych przepisów:', data);
        console.log('[API] Liczba pobranych przepisów:', data.content ? data.content.length : 'brak');

        // Dane paginacji są w zagnieżdżonym obiekcie 'page'
        const pageInfo = data.page || {};
        console.log('[API] Informacje o paginacji:', {
          currentPage: pageInfo.number,
          totalPages: pageInfo.totalPages,
          totalElements: pageInfo.totalElements,
          pageSize: pageInfo.size
        });

        return {
          content: data.content || [],
          totalPages: pageInfo.totalPages || 0,
          totalElements: pageInfo.totalElements || 0
        };
      }

      // Próba alternatywnej ścieżki API
      console.log(`[API] Próba alternatywnej ścieżki API dla userId=${userId}`);
      const fallbackUrl = `http://localhost:8080/api/v1/users/${userId}/followed-recipes?page=${page}&size=${favPageSize}`;
      console.log(`[API] URL zapytania alternatywnego: ${fallbackUrl}`);

      const fallbackResponse = await fetch(
        fallbackUrl,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`[API] Status odpowiedzi alternatywnej: ${fallbackResponse.status}`);

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        console.log('[API] Otrzymane dane z alternatywnego API:', data);

        // Dane paginacji są w zagnie��dżonym obiekcie 'page'
        const pageInfo = data.page || {};
        console.log('[API] Informacje o paginacji z alternatywnego źródła:', pageInfo);

        return {
          content: data.content || [],
          totalPages: pageInfo.totalPages || 0,
          totalElements: pageInfo.totalElements || 0
        };
      }

      console.error('[API] Nie udało się pobrać danych z żadnego źródła');
      setError(t('favoriteRecipesError'));
      return { content: [], totalPages: 0, totalElements: 0 };
    } catch (err) {
      console.error('[API] Błąd podczas pobierania ulubionych przepisów:', err);
      setError(t('favoriteRecipesError'));
      return { content: [], totalPages: 0, totalElements: 0 };
    } finally {
      setFavRecipesLoading(false);
    }
  };

  const fetchUserRecipes = async (userId, page = 0) => {
    if (!userId) return { content: [], totalPages: 0, totalElements: 0 };

    setUserRecipesLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return { content: [], totalPages: 0, totalElements: 0 };

    try {
      console.log(`Pobieranie przepisów użytkownika dla strony ${page}, rozmiar strony: ${pageSize}`);
      const response = await fetch(`http://localhost:8080/api/v1/recipes/my-recipes?page=${page}&size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError(t('authorizationError'));
        } else {
          setError(t('userRecipesError'));
        }
        return { content: [], totalPages: 0, totalElements: 0 };
      }

      const data = await response.json();
      console.log('Otrzymane dane z API:', data);

      // Dane paginacji są w zagnieżdżonym obiekcie 'page'
      const pageInfo = data.page || {};
      console.log('Informacje o paginacji z obiektu page:', pageInfo);

      return {
        content: data.content || [],
        totalPages: pageInfo.totalPages || 0,
        totalElements: pageInfo.totalElements || 0
      };
    } catch (err) {
      console.error('Błąd podczas pobierania przepisów:', err);
      setError(t('userRecipesError'));
      return { content: [], totalPages: 0, totalElements: 0 };
    } finally {
      setUserRecipesLoading(false);
    }
  };

  const refreshUserRecipes = async () => {
    if (!user) return;

    try {
      const result = await fetchUserRecipes(user.id, currentPage);
      setUserRecipes(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      showNotification('success', t('userRecipesRefreshed', 'Lista Twoich przepisów została odświeżona!'));
    } catch (err) {
      setError(t('refreshRecipesError'));
    }
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    setUserRecipesLoading(true);
    try {
      const result = await fetchUserRecipes(user.id, page);
      setUserRecipes(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      setError(t('userRecipesError'));
    }
  };

  const handleFavPageChange = async (page) => {
    setFavCurrentPage(page);
    setFavRecipesLoading(true);
    try {
      const result = await fetchFollowedRecipesWithPagination(user.id, page);
      setRecipes(result.content);
      setFavTotalPages(result.totalPages);
      setFavTotalElements(result.totalElements);
    } catch (err) {
      setError(t('favoriteRecipesError'));
    }
  };

  const handleDeleteClick = (recipe) => {
    setRecipeToDelete(recipe);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRecipeToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;

    setDeleteLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:8080/api/v1/recipes/${recipeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(t('deleteRecipeForbidden', 'Nie masz uprawnień do usunięcia tego przepisu.'));
        } else if (response.status === 401) {
          throw new Error(t('deleteRecipeUnauthorized', 'Musisz być zalogowany, aby usunąć ten przepis.'));
        } else {
          throw new Error(`${t('deleteRecipeError', 'Błąd podczas usuwania przepisu')}: ${response.status}`);
        }
      }

      // Aktualizacja lokalna bez ponownego ładowania
      setUserRecipes(userRecipes.filter(recipe => recipe.id !== recipeToDelete.id));
      // Zmniejsz łączną liczbę elementów
      setTotalElements(prev => prev - 1);

      // Przelicz całkowitą liczbę stron po usunięciu
      const newTotalPages = Math.ceil((totalElements - 1) / pageSize);
      setTotalPages(newTotalPages);

      // Jeśli usuniemy ostatni element na stronie, przejdź do poprzedniej strony
      // chyba że jesteśmy już na pierwszej stronie
      if (userRecipes.length === 1 && currentPage > 0) {
        handlePageChange(currentPage - 1);
      } else if (newTotalPages === 0) {
        // Jeśli usunęliśmy ostatni przepis
        setUserRecipes([]);
      } else {
        // W przeciwnym razie odśwież aktualną stronę
        handlePageChange(currentPage);
      }

      showNotification('success', t('recipeDeleted', 'Przepis został pomyślnie usunięty!'));
      setShowDeleteModal(false);
      setRecipeToDelete(null);
    } catch (err) {
      setError(t('deleteRecipeError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

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
              const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
              const padding = '='.repeat((4 - base64.length % 4) % 4);
              const decodedPayload = JSON.parse(atob(base64 + padding));

              const email = decodedPayload.sub;
              if (!email) {
                throw new Error("Brak emaila w tokenie");
              }

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
                setEditedUser(userData);
                setAuthState('authenticated');
              }

              // Pobierz przepisy użytkownika z paginacją
              const userRecipesResult = await fetchUserRecipes(userData.id, currentPage);
              if (isMounted) {
                setUserRecipes(userRecipesResult.content);
                setTotalPages(userRecipesResult.totalPages);
                setTotalElements(userRecipesResult.totalElements);
              }

              // Pobierz ulubione przepisy z paginacją
              const favRecipesResult = await fetchFollowedRecipesWithPagination(userData.id, favCurrentPage);
              if (isMounted) {
                setRecipes(favRecipesResult.content);
                setFavTotalPages(favRecipesResult.totalPages);
                setFavTotalElements(favRecipesResult.totalElements);
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
  }, [navigate, t, currentPage, favCurrentPage]);

  const refreshFollowedRecipes = async () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setFavRecipesLoading(true);
    try {
      const result = await fetchFollowedRecipesWithPagination(user.id, favCurrentPage);
      setRecipes(result.content);
      setFavTotalPages(result.totalPages);
      setFavTotalElements(result.totalElements);
      showNotification('success', t('recipesRefreshed', 'Lista ulubionych przepisów została odświeżona!'));
    } catch (err) {
      setError(t('refreshRecipesError'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('tokenChange'));
    navigate('/login');
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedUser(user);
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
        throw new Error(`${t('profileUpdateError')} ${response.status}`);
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditingProfile(false);
      showNotification('success', t('profileUpdated'));
    } catch (err) {
      setError(t('profileUpdateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('error', t('passwordsDoNotMatch', 'Nowe hasło i potwierdzenie hasła nie są identyczne!'));
      return;
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');

    try {
      const oldPasswordEncoded = encodeURIComponent(passwordData.currentPassword);
      const newPasswordEncoded = encodeURIComponent(passwordData.newPassword);

      const endpoint = `http://localhost:8080/api/v1/users/${user.id}/password?oldPassword=${oldPasswordEncoded}&newPassword=${newPasswordEncoded}`;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: headers,
        credentials: 'include'
      });

      if (!response.ok) {
        let errorMessage = '';

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || '';
        } catch (jsonError) {
          try {
            errorMessage = await response.text();
          } catch (textError) {}
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
      setError(t('passwordChangeError'));
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 5000);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('loading')}</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/login')}>
          {t('backToLogin')}
        </Button>
      </Container>
    );
  }

  if (authState !== 'authenticated' || !user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">{t('profileNotAvailable')}</Alert>
        <Button variant="primary" onClick={() => navigate('/login')}>
          {t('login')}
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>{t('profile')}</h2>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={refreshUserRecipes}>
            <i className="fas fa-sync-alt me-1"></i> {t('refreshMyRecipes', 'Odśwież moje przepisy')}
          </Button>
          <Button variant="outline-primary" onClick={() => navigate('/add-recipe')}>
            <i className="fas fa-plus me-1"></i> {t('addNewRecipe', 'Dodaj przepis')}
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-1"></i> {t('logout', 'Wyloguj')}
          </Button>
        </Col>
      </Row>

      {notification.message && (
        <Alert variant={notification.type === 'success' ? 'success' : 'danger'}
               dismissible
               onClose={() => setNotification({ type: '', message: '' })}>
          {notification.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col xs={12}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">{t('myRecipes', 'Moje przepisy')}</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/add-recipe')}
              >
                <i className="fas fa-plus me-1"></i> {t('addNewRecipe', 'Dodaj przepis')}
              </Button>
            </Card.Header>
            <Card.Body>
              {userRecipesLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">{t('loading', 'Ładowanie...')}</span>
                  </Spinner>
                </div>
              ) : userRecipes.length === 0 ? (
                <Alert variant="info">
                  {t('noUserRecipes', 'Nie masz jeszcze żadnych przepisów. Dodaj swój pierwszy przepis!')}
                </Alert>
              ) : (
                <>
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {userRecipes.map(recipe => (
                      <Col key={recipe.id}>
                        <Card className="recipe-card h-100 shadow-sm">
                          {recipe.mainImageUrl ? (
                            <div className="recipe-image-container">
                              <AuthorizedImage
                                src={recipe.mainImageUrl}
                                alt={recipe.title}
                                className="card-img-top"
                                style={{ height: '160px', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div className="bg-light text-center py-4" style={{ height: '160px' }}>
                              <i className="fas fa-image fa-3x text-muted"></i>
                              <p className="mt-2 text-muted">{t('noImage', 'Brak zdjęcia')}</p>
                            </div>
                          )}
                          <Card.Body>
                            <Card.Title>{recipe.title}</Card.Title>
                            <Card.Text as="div">
                              <div className="recipe-meta d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">
                                  <i className="fas fa-clock me-1"></i> {recipe.estimatedTimeToPrepare || t('unknown', 'nieznany')}
                                </small>
                                <div>
                                  <i className="fas fa-star text-warning me-1"></i>
                                  <small>{recipe.rate ? recipe.rate.toFixed(1) : '0.0'}</small>
                                  <small className="text-muted ms-1">({recipe.ratingCount || 0})</small>
                                </div>
                              </div>
                              {recipe.status && (
                                <div className="mb-2">
                                  <Badge
                                    bg={recipe.status === 'PUBLISHED' ? 'success' :
                                       recipe.status === 'PENDING' ? 'warning' :
                                       recipe.status === 'REJECTED' ? 'danger' : 'secondary'}
                                    className="me-1"
                                  >
                                    {recipe.status === 'PUBLISHED'
                                      ? t('published', 'Zaakceptowany')
                                      : recipe.status === 'PENDING'
                                        ? t('pending', 'Oczekujący')
                                        : recipe.status === 'REJECTED'
                                          ? t('rejected', 'Odrzucony')
                                          : t('draft', 'Zaakceptowany')}
                                  </Badge>
                                </div>
                              )}
                            </Card.Text>
                            <div className="d-flex justify-content-between mt-3">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/recipes/${recipe.id}`)}
                              >
                                <i className="fas fa-eye me-1"></i> {t('view', 'Podgląd')}
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => navigate(`/edit-recipe/${recipe.id}`)}
                              >
                                <i className="fas fa-edit me-1"></i> {t('edit', 'Edytuj')}
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteClick(recipe)}
                              >
                                <i className="fas fa-trash me-1"></i> {t('delete', 'Usuń')}
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Kontrolki paginacji w stylu App.js */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav aria-label="Page navigation">
                        <ul className="pagination">
                          {/* Przycisk Poprzednia strona */}
                          <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                              disabled={currentPage === 0}
                            >
                              &laquo; {t('previous', 'Poprzednia')}
                            </button>
                          </li>

                          {/* Numery stron */}
                          {[...Array(totalPages)].map((_, index) => {
                            // Pokazuj tylko strony w zakresie +/- 1 od obecnej, pierwszą i ostatnią
                            if (
                              index === 0 || // Zawsze pokazuj pierwszą stronę
                              index === totalPages - 1 || // Zawsze pokazuj ostatnią stronę
                              (index >= currentPage - 1 && index <= currentPage + 1) // Pokazuj strony obok bieżącej
                            ) {
                              return (
                                <li key={index} className={`page-item ${currentPage === index ? 'active' : ''}`}>
                                  <button
                                    className="page-link"
                                    onClick={() => handlePageChange(index)}
                                  >
                                    {index + 1}
                                  </button>
                                </li>
                              );
                            } else if (
                              (index === currentPage - 2 && currentPage > 2) ||
                              (index === currentPage + 2 && currentPage < totalPages - 3)
                            ) {
                              // Dodaj wskaźnik "..."
                              return (
                                <li key={index} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                            return null;
                          })}

                          {/* Przycisk Następna strona */}
                          <li className={`page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                              disabled={currentPage >= totalPages - 1}
                            >
                              {t('next', 'Następna')} &raquo;
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}

                  {/* Informacja o wyświetlanych przepisach */}
                  {totalPages > 1 && (
                    <div className="text-center text-muted mt-2">
                      {t('showingRecipes', 'Wyświetlanie {{start}}-{{end}} z {{total}} przepisów', {
                        start: totalElements === 0 ? 0 : currentPage * pageSize + 1,
                        end: Math.min((currentPage + 1) * pageSize, totalElements),
                        total: totalElements
                      })}
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showDeleteModal} onHide={handleCancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('confirmDelete', 'Potwierdź usunięcie')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('deleteRecipeConfirmation', 'Czy na pewno chcesz usunąć ten przepis?')}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDelete} disabled={deleteLoading}>
            {t('cancel', 'Anuluj')}
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deleteLoading}>
            {deleteLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-1">{t('deleting', 'Usuwanie...')}</span>
              </>
            ) : (
              t('delete', 'Usuń')
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Row className="mb-4">
        <Col md={12} lg={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">{t('personalInfo')}</h3>
              {!isEditingProfile && (
                <Button variant="primary" size="sm" onClick={handleProfileEdit}>
                  {t('edit')}
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {!isEditingProfile ? (
                <div>
                  <Row className="mb-2">
                    <Col sm={4} className="fw-bold">{t('firstName')}:</Col>
                    <Col sm={8}>{user.firstName}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={4} className="fw-bold">{t('lastName')}:</Col>
                    <Col sm={8}>{user.lastName}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">{t('email')}:</Col>
                    <Col sm={8}>{user.email}</Col>
                  </Row>
                  <Button
                    variant="outline-secondary"
                    className="mt-2"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    {t('changePassword')}
                  </Button>
                </div>
              ) : (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('firstName')}</Form.Label>
                    <Form.Control
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={editedUser.firstName || ''}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t('lastName')}</Form.Label>
                    <Form.Control
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={editedUser.lastName || ''}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t('email')}</Form.Label>
                    <Form.Control
                      type="email"
                      id="email"
                      name="email"
                      value={editedUser.email || ''}
                      onChange={handleInputChange}
                    />
                  </Form.Group>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      variant="secondary"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span className="ms-1">{t('saving', 'Zapisywanie...')}</span>
                        </>
                      ) : (
                        t('save')
                      )}
                    </Button>
                  </div>
                </Form>
              )}

              {isChangingPassword && (
                <div className="mt-4 pt-4 border-top">
                  <h4 className="h5 mb-3">{t('changePassword')}</h4>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('currentPassword')}</Form.Label>
                      <Form.Control
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordInputChange}
                      />
                      {passwordErrors.currentPassword && (
                        <Form.Text className="text-danger">
                          {passwordErrors.currentPassword}
                        </Form.Text>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>{t('newPassword')}</Form.Label>
                      <Form.Control
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        onBlur={() => setPasswordTouched(prev => ({ ...prev, newPassword: true }))}
                      />
                      {passwordErrors.newPassword && (
                        <Form.Text className="text-danger">
                          {passwordErrors.newPassword}
                        </Form.Text>
                      )}
                      <Form.Text className="text-muted">
                        {t('passwordRequirements', 'Hasło musi mieć co najmniej 8 znaków, zawierać wielką literę, cyfrę i znak specjalny.')}
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>{t('confirmPassword')}</Form.Label>
                      <Form.Control
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        onBlur={() => setPasswordTouched(prev => ({ ...prev, confirmPassword: true }))}
                      />
                      {passwordErrors.confirmPassword && (
                        <Form.Text className="text-danger">
                          {passwordErrors.confirmPassword}
                        </Form.Text>
                      )}
                    </Form.Group>

                    <div className="d-flex gap-2 justify-content-end">
                      <Button
                        variant="secondary"
                        onClick={() => setIsChangingPassword(false)}
                        disabled={isSaving}
                      >
                        {t('cancel')}
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleChangePassword}
                        disabled={isSaving || !validatePasswordForm()}
                      >
                        {isSaving ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            <span className="ms-1">{t('saving', 'Zapisywanie...')}</span>
                          </>
                        ) : (
                          t('changePassword')
                        )}
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} lg={6}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">{t('followedRecipes')}</h3>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={refreshFollowedRecipes}
              >
                <i className="fas fa-sync-alt me-1"></i> {t('refresh', 'Odśwież')}
              </Button>
            </Card.Header>
            <Card.Body>
              {favRecipesLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">{t('loading', 'Ładowanie...')}</span>
                  </Spinner>
                </div>
              ) : recipes.length === 0 ? (
                <Alert variant="info">{t('noFollowedRecipes')}</Alert>
              ) : (
                <>
                  <Row xs={1} md={2} className="g-4">
                    {recipes.map(recipe => (
                      <Col key={recipe.id || recipe.recipeId}>
                        <Card className="recipe-card h-100 shadow-sm">
                          {(recipe.mainImageUrl || recipe.recipeImageUrl) ? (
                            <div className="recipe-image-container">
                              <AuthorizedImage
                                src={recipe.mainImageUrl || recipe.recipeImageUrl}
                                alt={recipe.title || recipe.recipeTitle}
                                className="card-img-top"
                                style={{ height: '160px', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div className="bg-light text-center py-4" style={{ height: '160px' }}>
                              <i className="fas fa-image fa-3x text-muted"></i>
                              <p className="mt-2 text-muted">{t('noImage', 'Brak zdjęcia')}</p>
                            </div>
                          )}
                          <Card.Body>
                            <Card.Title>{recipe.title || recipe.recipeTitle}</Card.Title>
                            <Card.Text as="div">
                              <div className="recipe-meta d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">
                                  <i className="fas fa-clock me-1"></i> {recipe.estimatedTimeToPrepare || t('unknown', 'nieznany')}
                                </small>
                                <div>
                                  <i className="fas fa-star text-warning me-1"></i>
                                  <small>{recipe.rate ? recipe.rate.toFixed(1) : '0.0'}</small>
                                  <small className="text-muted ms-1">({recipe.ratingCount || 0})</small>
                                </div>
                              </div>
                            </Card.Text>
                            <div className="d-flex justify-content-center mt-3">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/recipes/${recipe.id || recipe.recipeId}`)}
                              >
                                <i className="fas fa-eye me-1"></i> {t('view', 'Podgląd')}
                              </Button>
                            </div>
                          </Card.Body>
                          <Card.Footer className="text-muted">
                            <small>{t('clickForDetails')}</small>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Kontrolki paginacji ulubnionych przepisów */}
                  {favTotalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav aria-label="Page navigation">
                        <ul className="pagination">
                          {/* Przycisk Poprzednia strona */}
                          <li className={`page-item ${favCurrentPage === 0 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handleFavPageChange(Math.max(0, favCurrentPage - 1))}
                              disabled={favCurrentPage === 0}
                            >
                              &laquo; {t('previous', 'Poprzednia')}
                            </button>
                          </li>

                          {/* Numery stron */}
                          {[...Array(favTotalPages)].map((_, index) => {
                            // Pokazuj tylko strony w zakresie +/- 1 od obecnej, pierwszą i ostatnią
                            if (
                              index === 0 || // Zawsze pokazuj pierwszą stronę
                              index === favTotalPages - 1 || // Zawsze pokazuj ostatnią stronę
                              (index >= favCurrentPage - 1 && index <= favCurrentPage + 1) // Pokazuj strony obok bieżącej
                            ) {
                              return (
                                <li key={index} className={`page-item ${favCurrentPage === index ? 'active' : ''}`}>
                                  <button
                                    className="page-link"
                                    onClick={() => handleFavPageChange(index)}
                                  >
                                    {index + 1}
                                  </button>
                                </li>
                              );
                            } else if (
                              (index === favCurrentPage - 2 && favCurrentPage > 2) ||
                              (index === favCurrentPage + 2 && favCurrentPage < favTotalPages - 3)
                            ) {
                              // Dodaj wskaźnik "..."
                              return (
                                <li key={index} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                            return null;
                          })}

                          {/* Przycisk Następna strona */}
                          <li className={`page-item ${favCurrentPage >= favTotalPages - 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handleFavPageChange(Math.min(favTotalPages - 1, favCurrentPage + 1))}
                              disabled={favCurrentPage >= favTotalPages - 1}
                            >
                              {t('next', 'Następna')} &raquo;
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}

                  {/* Informacja o wyświetlanych ulubionych przepisach */}
                  {favTotalPages > 1 && (
                    <div className="text-center text-muted mt-2">
                      {t('showingRecipes', 'Wyświetlanie {{start}}-{{end}} z {{total}} przepisów', {
                        start: favTotalElements === 0 ? 0 : favCurrentPage * favPageSize + 1,
                        end: Math.min((favCurrentPage + 1) * favPageSize, favTotalElements),
                        total: favTotalElements
                      })}
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
