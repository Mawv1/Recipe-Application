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

  const fetchUserRecipes = async (userId) => {
    if (!userId) return [];

    setUserRecipesLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
      const response = await fetch('http://localhost:8080/api/v1/recipes/my-recipes', {
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
        return [];
      }

      const data = await response.json();
      return data.content || data;
    } catch (err) {
      setError(t('userRecipesError'));
      return [];
    } finally {
      setUserRecipesLoading(false);
    }
  };

  const refreshUserRecipes = async () => {
    if (!user) return;

    try {
      const userRecipesData = await fetchUserRecipes(user.id);
      setUserRecipes(userRecipesData);
      showNotification('success', t('userRecipesRefreshed', 'Lista Twoich przepisów została odświeżona!'));
    } catch (err) {
      setError(t('refreshRecipesError'));
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

      setUserRecipes(userRecipes.filter(recipe => recipe.id !== recipeToDelete.id));

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

              const followedRecipes = await fetchFollowedRecipes(userData.id, token);
              if (isMounted) {
                setRecipes(followedRecipes);
              }

              const userRecipesData = await fetchUserRecipes(userData.id);
              if (isMounted) {
                setUserRecipes(userRecipesData);
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

  const refreshFollowedRecipes = async () => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const followedRecipes = await fetchFollowedRecipes(user.id, token);
      setRecipes(followedRecipes);
      showNotification('success', t('recipesRefreshed', 'Lista przepisów została odświeżona!'));
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
                                     (recipe.status === 'PENDING' ? 'warning' : 'secondary')}
                                  className="me-1"
                                >
                                  {recipe.status === 'PUBLISHED'
                                    ? t('published', 'Opublikowany')
                                    : (recipe.status === 'PENDING'
                                      ? t('pending', 'Oczekujący')
                                      : t('draft', 'Szkic'))}
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
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>{t('newPassword')}</Form.Label>
                      <Form.Control
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>{t('confirmPassword')}</Form.Label>
                      <Form.Control
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                      />
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
                        disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
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
            <Card.Header>
              <h3 className="h5 mb-0">{t('followedRecipes')}</h3>
            </Card.Header>
            <Card.Body>
              {recipes.length === 0 ? (
                <Alert variant="info">{t('noFollowedRecipes')}</Alert>
              ) : (
                <Row xs={1} md={1} className="g-4">
                  {recipes.map(recipe => (
                    <Col key={recipe.id || recipe.recipeId}>
                      <Card
                        className="h-100 recipe-card cursor-pointer"
                        onClick={() => navigate(`/recipes/${recipe.recipeId}`)}
                      >
                        <div className="bg-light" style={{ height: '100px' }} />
                        <Card.Body>
                          <Card.Title>{recipe.title || recipe.recipeTitle}</Card.Title>
                          {recipe.description && (
                            <Card.Text>
                              {recipe.description.length > 100
                                ? `${recipe.description.substring(0, 100)}...`
                                : recipe.description}
                            </Card.Text>
                          )}
                        </Card.Body>
                        <Card.Footer className="text-muted">
                          <small>{t('clickForDetails')}</small>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
