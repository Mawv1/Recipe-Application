import React, { useState, useEffect } from 'react';

/**
 * Komponent do wyświetlania obrazów z autoryzacją lub bez
 *
 * @param {string} src - ścieżka do obrazu
 * @param {string} alt - tekst alternatywny
 * @param {object} style - styl obrazu
 * @param {string} className - klasy CSS
 */
function AuthorizedImage({ src, alt, style = {}, className = '' }) {
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    const fetchImage = async () => {
      try {
        // Konstruowanie pełnego URL
        let fullImageUrl;
        if (src.startsWith('http')) {
          fullImageUrl = src;
        } else {
          // Upewnij się, że ścieżka zaczyna się od / ale nie ma podwójnych slashy
          const normalizedPath = src.startsWith('/') ? src : `/${src}`;
          fullImageUrl = `http://localhost:8080${normalizedPath}`;
        }

        setDebugInfo(prev => ({...prev, fullImageUrl}));

        // Najpierw sprawdzamy, czy token jest dostępny
        const token = localStorage.getItem('token');
        let response;

        if (token && (fullImageUrl.includes('/uploads/') || fullImageUrl.includes('/api/'))) {
          // Jeśli token jest dostępny i adres wskazuje na chronione zasoby, używamy go od razu
          response = await fetch(fullImageUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } else {
          // Dla zasobów publicznych lub gdy token jest niedostępny, próbujemy bez tokenu
          response = await fetch(fullImageUrl);

          // Jeśli nie udało się pobrać obrazu bez tokenu i token jest dostępny, próbujemy z tokenem
          if (!response.ok && token) {
            response = await fetch(fullImageUrl, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          }
        }

        if (!response.ok) {
          setDebugInfo(prev => ({...prev, responseStatus: response.status, responseStatusText: response.statusText}));
          throw new Error(`Błąd pobierania obrazu: ${response.status} ${response.statusText}`);
        }

        // Sprawdź typ zawartości odpowiedzi
        const contentType = response.headers.get('content-type');
        setDebugInfo(prev => ({...prev, contentType}));

        // Konwertuj odpowiedź na blob i utwórz URL
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setImageData(imageUrl);
      } catch (err) {
        setError(err.message);
        setDebugInfo(prev => ({...prev, error: err.message}));
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();

    // Czyszczenie URL po odmontowaniu komponentu
    return () => {
      if (imageData) {
        URL.revokeObjectURL(imageData);
      }
    };
  }, [src]);

  if (isLoading) {
    return <div className="image-loading">Ładowanie obrazu...</div>;
  }

  if (error) {
    return (
      <div className="image-error">
        <p>Nie udało się załadować obrazu: {error}</p>
        <p className="text-muted small">URL: {debugInfo.fullImageUrl}</p>
      </div>
    );
  }

  if (imageData) {
    return (
      <img
        src={imageData}
        alt={alt || 'Obraz przepisu'}
        style={{...style}}
        className={className}
      />
    );
  }

  return <div className="image-placeholder">Brak obrazu</div>;
}

export default AuthorizedImage;
