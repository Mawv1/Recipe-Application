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
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  // Stan przechowujący informację o zalogowanym użytkowniku
  const [currentUser, setCurrentUser] = useState(null);
  // Stan przechowujący informację, które komentarze użytkownik polubił/nie polubił
  const [userLikes, setUserLikes] = useState({});
  const [userDislikes, setUserDislikes] = useState({});
  const [refreshReactions, setRefreshReactions] = useState(false); // Stan do wymuszenia odświeżenia liczników reakcji

  // Stany do obsługi usuwania komentarzy
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const navigate = useNavigate();

  // Funkcja pobierająca dane zalogowanego użytkownika
  const fetchCurrentUser = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('tokenChange'));
          navigate('/login', { replace: true });
          throw new Error(t('sessionExpired', 'Sesja wygasła. Zaloguj się ponownie.'));
        }
        throw new Error(`${t('fetchUserError', 'Błąd podczas pobierania danych użytkownika')}: ${res.status}`);
      }

      const userData = await res.json();
      setCurrentUser(userData);
    } catch (err) {
      console.error('Błąd podczas pobierania danych użytkownika:', err);
    }
  };

  // Funkcja sprawdzająca, czy użytkownik może usunąć komentarz
  const canDeleteComment = (comment) => {
    if (!isAuthenticated || !currentUser) return false;

    // Admin może usuwać wszystkie komentarze
    if (currentUser.role === 'ADMIN') return true;

    // Autor komentarza może usunąć swój komentarz
    if (comment.author.id === currentUser.id) return true;

    // Autor przepisu może usunąć komentarz pod swoim przepisem
    if (recipe && recipe.author && recipe.author.id === currentUser.id) return true;

    return false;
  };

  // Funkcja otwierająca modal potwierdzenia usunięcia komentarza
  const openDeleteConfirmation = (comment) => {
    setCommentToDelete(comment);
    setShowDeleteModal(true);
  };

  // Funkcja zamykająca modal potwierdzenia
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  // Funkcja usuwająca komentarz
  const handleDeleteComment = async () => {
    if (!commentToDelete || !isAuthenticated) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/v1/comments/${commentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('tokenChange'));
          navigate('/login', { replace: true });
          throw new Error(t('sessionExpired', 'Sesja wygasła. Zaloguj się ponownie.'));
        }
        throw new Error(`${t('deleteCommentError', 'Błąd podczas usuwania komentarza')}: ${res.status}`);
      }

      // Usuń komentarz z lokalnego stanu
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentToDelete.id));
      closeDeleteModal();
    } catch (err) {
      console.error('Błąd podczas usuwania komentarza:', err);
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

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
      // Używamy nowego endpointu zgodnie z backendem
      const res = await fetch(`http://localhost:8080/api/v1/users/me/followed-recipes/${id}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log('[Śledzenie] Status śledzenia przepisu:', data);
        setIsFollowed(data.followed);
        // Aktualizujemy również lokalny storage
        localStorage.setItem(`recipe-${id}-followed`, data.followed.toString());
      } else if (res.status === 401 || res.status === 403) {
        // Użytkownik niezalogowany lub brak uprawnień
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('tokenChange'));
        navigate('/login', { replace: true });
      } else {
        // W przypadku innych błędów, próbujemy odczytać stan z localStorage
        const localFollowState = localStorage.getItem(`recipe-${id}-followed`) === 'true';
        setIsFollowed(localFollowState);
      }
    } catch (err) {
      console.error('[Śledzenie] Błąd podczas sprawdzania statusu śledzenia:', err);
      // W przypadku błędu, próbujemy odczytać stan z localStorage
      const localFollowState = localStorage.getItem(`recipe-${id}-followed`) === 'true';
      setIsFollowed(localFollowState);
    }
  };

  // Funkcja pobierająca komentarze do przepisu
  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/v1/recipes/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!res.ok) {
        throw new Error(t('fetchCommentsError', 'Błąd podczas pobierania komentarzy: ') + res.statusText);
      }

      const data = await res.json();
      // Komentarze są dostępne bezpośrednio w obiekcie przepisu
      setComments(data.comments || []);
      // Aktualizujemy również dane przepisu
      setRecipe(data);
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentsLoading(false);
    }
  }, [id, t]);

  // Funkcja dodająca nowy komentarz
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      setCommentError(t('emptyCommentError', 'Komentarz nie może być pusty'));
      return;
    }

    setCommentSubmitting(true);
    setCommentError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/v1/recipes/${id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment,
          likesCount: 0,
          dislikesCount: 0,
          recipeId: Number(id) // Zgodnie z CommentRequestDTO
        })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('tokenChange'));
          navigate('/login', { replace: true });
          throw new Error(t('sessionExpired', 'Sesja wygasła. Zaloguj się ponownie.'));
        }
        throw new Error(`${t('commentError', 'Błąd podczas dodawania komentarza')}: ${res.status} ${res.statusText}`);
      }

      // Po dodaniu komentarza odświeżamy listę
      await fetchComments();
      setNewComment(''); // Czyszczenie pola komentarza
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Funkcja odświeżająca dane konkretnego komentarza
  const refreshCommentReactions = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/v1/comments/${commentId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (res.ok) {
        const updatedComment = await res.json();
        // Aktualizujemy tylko ten konkretny komentarz
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId ? { ...comment, likesCount: updatedComment.likesCount, dislikesCount: updatedComment.dislikesCount } : comment
          )
        );
      }
    } catch (err) {
      console.error('Błąd podczas odświeżania reakcji komentarza:', err);
    }
  };

  // Inicjalizacja stanu polubień po załadowaniu komentarzy
  useEffect(() => {
    if (recipe && recipe.comments && recipe.comments.length > 0 && isAuthenticated) {
      const token = localStorage.getItem('token');

      // Tworzymy obiekt dla aktualnych komentarzy
      const currentLikes = {};
      const currentDislikes = {};

      // Asynchronicznie pobieramy stan reakcji dla każdego komentarza
      const fetchReactions = async () => {
        for (const comment of recipe.comments) {
          try {
            // Sprawdzamy czy użytkownik polubił komentarz
            const likeRes = await fetch(`http://localhost:8080/api/v1/comments/${comment.id}/liked`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (likeRes.ok) {
              const likeData = await likeRes.json();
              console.log(`Like data for comment ${comment.id}:`, likeData);

              // Bardziej precyzyjna interpretacja odpowiedzi z serwera
              // Przypisujemy wartość true tylko gdy odpowiedź jest jednoznacznie true
              // Zakładamy, że serwer może zwracać true/false, "true"/"false", 1/0, lub obiekt
              currentLikes[comment.id] = likeData === true ||
                                         likeData === "true" ||
                                         likeData === 1 ||
                                         (typeof likeData === 'object' && likeData !== null && likeData.liked === true);
            }

            // Sprawdzamy czy użytkownik nie lubi komentarza
            const dislikeRes = await fetch(`http://localhost:8080/api/v1/comments/${comment.id}/disliked`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (dislikeRes.ok) {
              const dislikeData = await dislikeRes.json();
              console.log(`Dislike data for comment ${comment.id}:`, dislikeData);

              // Bardziej precyzyjna interpretacja odpowiedzi z serwera
              currentDislikes[comment.id] = dislikeData === true ||
                                            dislikeData === "true" ||
                                            dislikeData === 1 ||
                                            (typeof dislikeData === 'object' && dislikeData !== null && dislikeData.disliked === true);
            }
          } catch (err) {
            console.error(`Błąd podczas pobierania reakcji dla komentarza ${comment.id}:`, err);
          }
        }

        // Debugowanie - pokazujemy w konsoli, jakie stany zostały ustalone
        console.log("Current likes state:", currentLikes);
        console.log("Current dislikes state:", currentDislikes);

        setUserLikes(currentLikes);
        setUserDislikes(currentDislikes);
      };

      fetchReactions();
    } else if (recipe && recipe.comments) {
      // Na początek inicjalizujemy pustymi obiektami dla niezalogowanych
      setUserLikes({});
      setUserDislikes({});
    }
  }, [recipe, isAuthenticated]);

  // Funkcje do obsługi polubień i nielubień komentarzy
  const handleLikeComment = async (commentId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Zapamiętujemy aktualny stan polubienia
      const isCurrentlyLiked = userLikes[commentId] === true;
      const isCurrentlyDisliked = userDislikes[commentId] === true;

      // Znajdujemy komentarz
      const commentToUpdate = comments.find(c => c.id === commentId);
      if (!commentToUpdate) return;

      // Aktualizujemy UI natychmiast dla lepszego UX
      setUserLikes(prev => ({
        ...prev,
        [commentId]: !isCurrentlyLiked
      }));

      // Aktualizujemy licznik polubień - zmniejszamy, jeśli było już polubione
      let likeDelta = isCurrentlyLiked ? -1 : 1;

      // Jeśli było dislike, które jest teraz usuwane, aktualizujemy również licznik dislike
      let dislikeDelta = 0;
      if (userDislikes[commentId]) {
        setUserDislikes(prev => ({
          ...prev,
          [commentId]: false
        }));
        dislikeDelta = -1;
      }

      // Natychmiastowa aktualizacja liczników w UI
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId ? {
            ...comment,
            likesCount: Math.max(0, comment.likesCount + likeDelta),
            dislikesCount: Math.max(0, comment.dislikesCount + dislikeDelta)
          } : comment
        )
      );

      // Wywołujemy odpowiednie API
      let url = `http://localhost:8080/api/v1/comments/${commentId}/like`;

      // Jeśli komentarz był już polubiony, usuwamy reakcję
      if (isCurrentlyLiked) {
        url = `http://localhost:8080/api/v1/comments/${commentId}/reaction`;
      }

      const response = await fetch(url, {
        method: isCurrentlyLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // W przypadku błędu, przywracamy poprzedni stan
        setUserLikes(prev => ({
          ...prev,
          [commentId]: isCurrentlyLiked
        }));

        if (isCurrentlyDisliked) {
          setUserDislikes(prev => ({
            ...prev,
            [commentId]: true
          }));
        }

        // Przywracamy poprzednie liczniki
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId ? {
              ...comment,
              likesCount: comment.likesCount - likeDelta,
              dislikesCount: comment.dislikesCount - dislikeDelta
            } : comment
          )
        );

        throw new Error(`${t('likeError', 'Błąd podczas interakcji z pozytywną oceną')}: ${response.status}`);
      }

      // Odświeżamy dane konkretnego komentarza aby zsynchronizować z serwerem
      await refreshCommentReactions(commentId);
    } catch (err) {
      console.error('Błąd podczas obsługi polubienia:', err);
    }
  };

  const handleDislikeComment = async (commentId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Zapamiętujemy aktualny stan nielubienia
      const isCurrentlyDisliked = userDislikes[commentId] === true;
      const isCurrentlyLiked = userLikes[commentId] === true;

      // Znajdujemy komentarz
      const commentToUpdate = comments.find(c => c.id === commentId);
      if (!commentToUpdate) return;

      // Aktualizujemy UI natychmiast dla lepszego UX
      setUserDislikes(prev => ({
        ...prev,
        [commentId]: !isCurrentlyDisliked
      }));

      // Aktualizujemy licznik nielubień - zmniejszamy, jeśli było już nielubione
      let dislikeDelta = isCurrentlyDisliked ? -1 : 1;

      // Jeśli był like, który jest teraz usuwany, aktualizujemy również licznik like
      let likeDelta = 0;
      if (userLikes[commentId] === true) {
        setUserLikes(prev => ({
          ...prev,
          [commentId]: false
        }));
        likeDelta = -1;
      }

      // Natychmiastowa aktualizacja liczników w UI
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId ? {
            ...comment,
            dislikesCount: Math.max(0, comment.dislikesCount + dislikeDelta),
            likesCount: Math.max(0, comment.likesCount + likeDelta)
          } : comment
        )
      );

      // Wywołujemy odpowiednie API
      let url = `http://localhost:8080/api/v1/comments/${commentId}/dislike`;

      // Jeśli komentarz był już nielubiony, usuwamy reakcję
      if (isCurrentlyDisliked) {
        url = `http://localhost:8080/api/v1/comments/${commentId}/reaction`;
      }

      const response = await fetch(url, {
        method: isCurrentlyDisliked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // W przypadku błędu, przywracamy poprzedni stan
        setUserDislikes(prev => ({
          ...prev,
          [commentId]: isCurrentlyDisliked
        }));

        if (isCurrentlyLiked) {
          setUserLikes(prev => ({
            ...prev,
            [commentId]: true
          }));
        }

        // Przywracamy poprzednie liczniki
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId ? {
              ...comment,
              dislikesCount: comment.dislikesCount - dislikeDelta,
              likesCount: comment.likesCount - likeDelta
            } : comment
          )
        );

        throw new Error(`${t('dislikeError', 'Błąd podczas interakcji z negatywną oceną')}: ${response.status}`);
      }

      // Odświeżamy dane konkretnego komentarza aby zsynchronizować z serwerem
      await refreshCommentReactions(commentId);
    } catch (err) {
      console.error('Błąd podczas obsługi nielubienia:', err);
    }
  };

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/recipes/${id}`, message: 'Zaloguj się, aby dodać przepis do obserwowanych.' } });
      return;
    }

    setFollowLoading(true);
    const token = localStorage.getItem('token');
    const currentStatus = isFollowed;

    try {
      console.log(`[Śledzenie] Zmiana statusu przepisu ${id}, aktualny status: ${currentStatus ? 'obserwowany' : 'nieobserwowany'}`);

      // Używamy nowych endpointów zgodnie z kontrolerem UserController
      // POST /api/v1/users/me/followed-recipes/{recipeId} - dodaj do obserwowanych
      // DELETE /api/v1/users/me/followed-recipes/{recipeId} - usuń z obserwowanych
      const url = `http://localhost:8080/api/v1/users/me/followed-recipes/${id}`;
      const method = currentStatus ? 'DELETE' : 'POST';

      console.log(`[Śledzenie] Wysyłanie żądania ${method} do ${url}`);

      const res = await fetch(url, {
        method: method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[Śledzenie] Status odpowiedzi: ${res.status}`);

      if (res.ok) {
        const newStatus = !currentStatus;
        console.log(`[Śledzenie] Zmieniono status na: ${newStatus ? 'obserwowany' : 'nieobserwowany'}`);

        // Zapisz lokalnie status obserwowania
        localStorage.setItem(`recipe-${id}-followed`, newStatus.toString());
        setIsFollowed(newStatus);

        // Zaktualizuj liczbę obserwujących w obiekcie przepisu
        setRecipe(prev => ({
          ...prev,
          favoritesCount: prev.favoritesCount + (newStatus ? 1 : -1)
        }));

        // Wyświetl komunikat o sukcesie
        setSnackbarMessage(newStatus
          ? 'Przepis został dodany do obserwowanych.'
          : 'Przepis został usunięty z obserwowanych.');
        setSnackbarOpen(true);

        // Emituj zdarzenie zmiany przepisu, aby odświeżyć listę na stronie głównej
        window.dispatchEvent(new Event('recipeChange'));
      } else {
        console.error(`[Śledzenie] Błąd: ${res.status}`);
        let errorMsg = 'Wystąpił błąd przy aktualizacji obserwowanych przepisów.';

        if (res.status === 401 || res.status === 403) {
          // Usuwamy token, emitujemy zdarzenie (bez odświeżania strony)
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          window.dispatchEvent(new Event('tokenChange'));
          navigate('/login', { replace: true });
          errorMsg = 'Sesja wygasła. Zaloguj się ponownie.';
        }

        setSnackbarMessage(errorMsg);
        setSnackbarOpen(true);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[Śledzenie] Wyjątek:', error);
      setSnackbarMessage('Wystąpił błąd przy aktualizacji obserwowanych przepisów.');
      setSnackbarOpen(true);
    } finally {
      setFollowLoading(false);
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
      fetchComments();
      fetchCurrentUser();
    }
  }, [id, isAuthenticated, fetchComments]);

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
      {/* Modal potwierdzający usunięcie komentarza */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('deleteCommentTitle', 'Usuń komentarz')}</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal} disabled={deleteLoading}></button>
              </div>
              <div className="modal-body">
                <p>{t('deleteCommentConfirmation', 'Czy na pewno chcesz usunąć ten komentarz? Ta operacja jest nieodwracalna.')}</p>
                {commentToDelete && (
                  <div className="p-3 bg-light rounded">
                    <small className="text-muted">{commentToDelete.author.firstName} {commentToDelete.author.lastName} napisał(a):</small>
                    <p className="mb-0 mt-2">{commentToDelete.content}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal} disabled={deleteLoading}>
                  {t('cancel', 'Anuluj')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteComment}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {t('deleting', 'Usuwanie...')}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash-alt me-2"></i>
                      {t('delete', 'Usuń')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    onClick={toggleFollow}
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

            <div className="recipe-comments mt-4 p-3 bg-light rounded shadow">
              <h4 className="mb-3">
                <i className="far fa-comments me-2 text-primary"></i>
                {t('comments', 'Komentarze')}
              </h4>
              {commentsLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('loadingComments', 'Ładowanie komentarzy...')}</span>
                  </div>
                  <p className="mt-2">{t('loadingComments', 'Ładowanie komentarzy...')}</p>
                </div>
              ) : commentError ? (
                <div className="alert alert-danger">{commentError}</div>
              ) : comments && comments.length > 0 ? (
                <ul className="list-unstyled comments-list">
                  {comments.map((comment, index) => (
                    <li key={index} className="mb-4">
                      <div className="comment-card p-3 bg-white rounded shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="comment-author">
                            <i className="fas fa-user-circle me-2 text-secondary"></i>
                            <strong>{comment.author.firstName} {comment.author.lastName}</strong>
                          </div>
                          <small className="text-muted">
                            {new Date(comment.dateOfCreation).toLocaleString()}
                          </small>
                        </div>

                        <div className="comment-content mb-3 text-start px-2">
                          <p className="mb-0" style={{ textAlign: 'left' }}>{comment.content}</p>
                        </div>

                        <div className="comment-actions d-flex align-items-center">
                          <button
                            className={`btn btn-sm ${userLikes[comment.id] ? 'btn-success' : 'btn-outline-success'} me-3 d-flex align-items-center px-3 py-2`}
                            onClick={() => handleLikeComment(comment.id)}
                            disabled={!isAuthenticated}
                            title={userLikes[comment.id] ? t('removeLike', 'Usu�� polubienie') : t('like', 'Polub')}
                          >
                            <i className="fas fa-thumbs-up me-2" style={{ fontSize: '1.1rem' }}></i>
                            <span className="fw-bold">{comment.likesCount || 0}</span>
                          </button>

                          <button
                            className={`btn btn-sm ${userDislikes[comment.id] ? 'btn-danger' : 'btn-outline-danger'} d-flex align-items-center px-3 py-2`}
                            onClick={() => handleDislikeComment(comment.id)}
                            disabled={!isAuthenticated}
                            title={userDislikes[comment.id] ? t('removeDislike', 'Usuń negatywną ocenę') : t('dislike', 'Nie lubię')}
                          >
                            <i className="fas fa-thumbs-down me-2" style={{ fontSize: '1.1rem' }}></i>
                            <span className="fw-bold">{comment.dislikesCount || 0}</span>
                          </button>

                          {canDeleteComment(comment) && (
                            <button
                              className="btn btn-sm btn-outline-danger ms-3"
                              onClick={() => openDeleteConfirmation(comment)}
                              title={t('deleteComment', 'Usuń komentarz')}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-3 bg-white rounded shadow-sm">
                  <i className="far fa-comment-dots text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                  <p className="mb-0">{t('noComments', 'Brak komentarzy. Bądź pierwszym, który skomentuje ten przepis!')}</p>
                </div>
              )}

              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="mt-4 p-3 bg-white rounded shadow-sm">
                  <h5 className="mb-3">
                    <i className="fas fa-pen me-2 text-primary"></i>
                    {t('addComment', 'Dodaj komentarz')}
                  </h5>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('addCommentPlaceholder', 'Co myślisz o tym przepisie?')}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={commentSubmitting}
                  >
                    {commentSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    ) : <i className="far fa-paper-plane me-2"></i>}
                    {t('submitComment', 'Dodaj komentarz')}
                  </button>
                  {commentError && <p className="text-danger mt-2">{commentError}</p>}
                </form>
              ) : (
                <div className="mt-4 p-3 bg-white rounded shadow-sm text-center">
                  <p className="mb-2">{t('loginToComment', 'Zaloguj się, aby dodać komentarz')}</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-outline-primary"
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    {t('login', 'Zaloguj się')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default RecipeDetails;
