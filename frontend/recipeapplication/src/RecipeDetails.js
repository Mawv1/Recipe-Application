import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as solidHeart, faTimes, faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart, faStar as regularStar } from '@fortawesome/free-regular-svg-icons';
import './RecipeDetails.css';
import AuthorizedImage from './components/AuthorizedImage'; // Dodajemy import komponentu AuthorizedImage

// Komponent do wyświetlania i oceniania gwiazdkami
function StarRating({ initialRating, totalStars = 5, onRatingChange, readonly = false }) {
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starIndex) => {
    if (readonly) return;
    const newRating = starIndex + 1;
    setRating(newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (starIndex) => {
    if (readonly) return;
    setHoverRating(starIndex + 1);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  return (
    <div className="star-rating">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = hoverRating ? starValue <= hoverRating : starValue <= rating;

        return (
          <span
            key={index}
            className={`star-rating-icon ${readonly ? 'readonly' : ''}`}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <FontAwesomeIcon
              icon={isFilled ? solidStar : regularStar}
              className={isFilled ? "text-warning" : "text-muted"}
              size="lg"
            />
          </span>
        );
      })}
      {!readonly && <span className="ms-2 rating-value">({rating})</span>}
    </div>
  );
}

function RecipeDetails() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowed, setIsFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [localFollowState, setLocalFollowState] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const navigate = useNavigate();

  const fetchUserRating = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`http://localhost:8080/api/v1/recipes/${id}/rating`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 404) {
        setUserRating(0);
      } else if (res.status === 403) {
        // Brak uprawnień - użytkownik nie zalogowany
      } else if (res.ok) {
        const data = await res.json();
        setUserRating(data.value);
      }
    } catch (err) {
      // Obsługa błędu podczas pobierania oceny
    }
  };

  const checkFollowStatus = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('token');
      // Sprawdzamy, czy przepis jest już w lokalnym storage jako polubiony
      const localFollowState = localStorage.getItem(`recipe-${id}-followed`) === 'true';
      setIsFollowed(localFollowState);
    } catch (err) {
      // W przypadku błędu, próbujemy odczytać stan z localStorage
      const localFollowState = localStorage.getItem(`recipe-${id}-followed`) === 'true';
      setIsFollowed(localFollowState);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:8080/api/v1/recipes/${id}`, {
      headers: {
        'Authorization': token ? 'Bearer ' + token : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(t('fetchRecipeError', 'Błąd podczas pobierania przepisu: ') + res.statusText);
        return res.json();
      })
      .then(data => {
        setRecipe(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, t]);

  useEffect(() => {
    if (isAuthenticated && id) {
      const token = localStorage.getItem('token');
      checkFollowStatus(token);
      fetchUserRating(token);
    }
  }, [id, isAuthenticated]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    const token = localStorage.getItem('token');

    const currentStatus = isFollowed;

    try {
      const url = `http://localhost:8080/api/v1/users/me/followed-recipes/${id}`;
      const method = currentStatus ? 'DELETE' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const newStatus = !currentStatus;

        // Zapisz lokalnie status polubienia
        localStorage.setItem(`recipe-${id}-followed`, newStatus.toString());
        setIsFollowed(newStatus);

        // Zaktualizuj liczbę polubień w obiekcie przepisu
        setRecipe(prev => ({
          ...prev,
          favoritesCount: prev.favoritesCount + (newStatus ? 1 : -1)
        }));

        // Emituj zdarzenie zmiany przepisu, aby odświeżyć listę na stronie głównej
        window.dispatchEvent(new Event('recipeChange'));
      } else {
        if (res.status === 401 || res.status === 403) {
          // Usuwamy token, emitujemy zdarzenie (bez odświeżania strony)
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('tokenChange'));
          navigate('/login', { replace: true });
          throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        }
        throw new Error(`Nie udało się wykonać operacji: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      // Obsługa błędu
      setIsFollowed(prevState => prevState); // Przywracamy poprzedni stan w przypadku błędu
    } finally {
      setFollowLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (userRating === 0) {
      setRatingError(t('selectRatingError', 'Wybierz ocenę przed wysłaniem'));
      return;
    }

    setRatingSubmitting(true);
    setRatingError(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:8080/api/v1/recipes/${id}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: userRating }) // Zmiana z "rating" na "value", zgodnie z RatingRequestDTO
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Usuwamy token, emitujemy zdarzenie (bez odświeżania strony)
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('tokenChange'));
          navigate('/login', { replace: true });
          throw new Error(t('sessionExpired', 'Sesja wygasła. Zaloguj się ponownie.'));
        }
        throw new Error(`${t('ratingError', 'Błąd podczas oceniania')}: ${res.status} ${res.statusText}`);
      }

      // Zaktualizuj średnią ocenę w przepisie
      const updatedRecipeRes = await fetch(`http://localhost:8080/api/v1/recipes/${id}`, {
        headers: {
          'Authorization': token ? 'Bearer ' + token : ''
        }
      });

      if (!updatedRecipeRes.ok) {
        throw new Error(t('fetchRecipeError', 'Błąd podczas aktualizacji przepisu: ') + updatedRecipeRes.statusText);
      }

      const updatedRecipe = await updatedRecipeRes.json();
      setRecipe(updatedRecipe);

      // Emituj zdarzenie zmiany przepisu, aby odświeżyć listę na stronie głównej
      window.dispatchEvent(new Event('recipeChange'));

      alert(t('ratingSuccess', 'Twoja ocena została zapisana!'));
    } catch (err) {
      setRatingError(err.message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (!recipe) return null;

  const formatFavoritesCount = (count) => {
    if (!count) return 0;

    if (count >= 1000) {
      const formattedCount = (count / 1000).toFixed(1);
      return i18n.language === 'pl' ? `${formattedCount} tys.` : `${formattedCount}K`;
    }

    return count;
  };

  return (
    <main className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="recipe-details-content">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button className="back-btn" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left me-2"></i>
                {t('back', 'Powrót')}
              </button>

              {isAuthenticated && (
                <div className="recipe-actions">
                  <button
                    className={`follow-btn ${isFollowed ? 'followed' : ''}`}
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    title={isFollowed
                      ? t('removeFromFavorites', 'Usuń z ulubionych')
                      : t('addToFavorites', 'Dodaj do ulubionych')}
                  >
                    {followLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={isFollowed ? solidHeart : regularHeart} />
                        {isFollowed && (
                          <span className="remove-indicator">
                            <FontAwesomeIcon icon={faTimes} />
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  <span className="favorite-text">
                    {isFollowed
                      ? t('removeFromFavorites', 'Usuń z ulubionych')
                      : t('addToFavorites', 'Dodaj do ulubionych')}
                  </span>
                </div>
              )}
            </div>

            <h2>{recipe.title}</h2>

            <p className="recipe-author">
              <i className="fas fa-user me-1 text-secondary"></i> {recipe.author.firstName} {recipe.author.lastName}
            </p>

            {recipe.mainImageUrl && (
              <div className="recipe-main-image mb-4">
                <AuthorizedImage
                  src={recipe.mainImageUrl}
                  alt={recipe.title}
                  className="img-fluid rounded"
                  style={{ maxHeight: '400px', objectFit: 'cover', width: '100%' }}
                />
              </div>
            )}

            <div className="recipe-meta d-flex align-items-center flex-wrap gap-3 mb-3">
              <span className="d-inline-flex align-items-center">
                <FontAwesomeIcon icon={solidStar} className="text-warning me-2" />
                <span>{recipe.rate ? recipe.rate.toFixed(2) : '0.00'}</span>
                <small className="text-muted ms-1">({recipe.ratingCount || 0})</small>
              </span>
              <span className="d-inline-flex align-items-center">
                <FontAwesomeIcon icon={solidHeart} className="text-danger me-2" />
                <span>{formatFavoritesCount(recipe.favoritesCount)}</span>
              </span>
              <span className="d-inline-flex align-items-center">
                <i className="fas fa-clock text-primary me-2"></i>
                <span>{recipe.estimatedTimeToPrepare}</span>
              </span>
            </div>

            <div className="recipe-ingredients-section mb-4 p-4 bg-light rounded shadow-sm">
              <h4 className="mb-3">
                <i className="fas fa-utensils me-2 text-warning"></i>
                {t('ingredients', 'Składniki')}
              </h4>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <ul className="recipe-ingredients-list">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="recipe-ingredient-item">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      {typeof ingredient === 'string'
                        ? ingredient
                        : `${ingredient.name || ''} ${ingredient.amount || ''} ${ingredient.unit || ''}`.trim()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">{t('noIngredients', 'Brak składników.')}</p>
              )}
            </div>

            <div className="recipe-description" dangerouslySetInnerHTML={{ __html: recipe.description }} />

            <div className="recipe-rating mt-4 p-3 bg-light rounded">
              <h4 className="mb-3">{t('rateRecipe', 'Oceń przepis')}</h4>
              <div className="d-flex align-items-center mb-3">
                <StarRating
                  initialRating={userRating}
                  onRatingChange={(newRating) => setUserRating(newRating)}
                  readonly={ratingSubmitting || !isAuthenticated}
                />
                {isAuthenticated ? (
                  <button
                    onClick={handleRatingSubmit}
                    disabled={ratingSubmitting}
                    className="btn btn-warning ms-3"
                  >
                    {ratingSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    ) : null}
                    {t('submitRating', 'Wyślij ocenę')}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-outline-warning ms-3"
                  >
                    {t('loginToRate', 'Zaloguj się, aby ocenić')}
                  </button>
                )}
              </div>
              {ratingError && <p className="text-danger">{ratingError}</p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default RecipeDetails;
