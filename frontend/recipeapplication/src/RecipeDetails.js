import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as solidHeart, faTimes, faStar as solidStar } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart, faStar as regularStar } from '@fortawesome/free-regular-svg-icons';
import './RecipeDetails.css';

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
  const { t } = useTranslation();
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

  const checkFollowStatus = useCallback((token) => {
    if (!isAuthenticated || !id || !token) return;

    const requestHeaders = {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };

    fetch(`http://localhost:8080/api/v1/users/me/followed-recipes/${id}/status`, {
      headers: requestHeaders,
      method: 'GET',
      cache: 'no-cache'
    })
      .then(res => {
        console.log('Status odpowiedzi ze sprawdzenia statusu:', res.status);
        if (!res.ok) {
          throw new Error('Nie udało się sprawdzić statusu obserwowania');
        }
        return res.json();
      })
      .then(data => {
        console.log('Status obserwowania z API po operacji:', data.followed);

        if (localFollowState !== null) {
          console.log('Używam lokalnie zapisanego stanu:', localFollowState);
          setIsFollowed(localFollowState);
        } else {
          setIsFollowed(data.followed);
        }
      })
      .catch(err => {
        console.error('Błąd sprawdzania statusu obserwowania:', err);
      });
  }, [id, isAuthenticated, localFollowState]);

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
    }
  }, [id, isAuthenticated, checkFollowStatus]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    const token = localStorage.getItem('token');

    const currentStatus = isFollowed;
    console.log('Aktualny status przed zmianą:', currentStatus);

    try {
      const url = `http://localhost:8080/api/v1/users/me/followed-recipes/${id}`;
      const method = currentStatus ? 'DELETE' : 'POST';

      console.log(`Wysyłam żądanie ${method} na adres ${url}`);

      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status odpowiedzi:', res.status);

      if (res.ok) {
        const newStatus = !currentStatus;
        console.log('Operacja zakończona sukcesem. Ustawiamy lokalny stan na:', newStatus);

        setLocalFollowState(newStatus);
        setIsFollowed(newStatus);

        if (method === 'POST' && res.status === 201) {
          try {
            const responseData = await res.clone().json();
            console.log('Odpowiedź z API (dodawanie do ulubionych):', responseData);
          } catch (e) {
            console.log('Nie udało się sparsować odpowiedzi jako JSON');
          }
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          navigate('/login');
          throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        }
        throw new Error(`Nie udało się wykonać operacji: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.error('Błąd podczas obserwowania przepisu:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Nowa funkcja do wysyłania oceny
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
        body: JSON.stringify({ rating: userRating })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          navigate('/login');
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

      alert(t('ratingSuccess', 'Twoja ocena została zapisana!'));
    } catch (err) {
      console.error('Błąd podczas oceniania przepisu:', err);
      setRatingError(err.message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) return <div className="loading-text">{t('loading', 'Ładowanie...')}</div>;
  if (error) return <div className="error-text">{error}</div>;
  if (!recipe) return null;

  return (
    <div className="recipe-details-container">
      <button className="back-btn" onClick={() => navigate(-1)}>{t('back', 'Powrót')}</button>
      <h2>{recipe.title}</h2>

      <p className="recipe-author">{t('author')}: {recipe.author.firstName} {recipe.author.lastName}</p>
      <div className="recipe-meta">
        <span>{t('rate')}: {recipe.rate}</span> | <span>{t('estimatedTime')}: {recipe.estimatedTimeToPrepare}</span>
      </div>

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

      <p className="recipe-description">{recipe.description}</p>

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
  );
}

export default RecipeDetails;
