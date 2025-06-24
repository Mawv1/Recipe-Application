import logo from './logo.svg';
import './App.css';
import Header from './Header';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import RecipeDetails from './RecipeDetails';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import AddRecipe from './AddRecipe';
import EditRecipe from './EditRecipe'; // Dodany import komponentu EditRecipe
import AdminPanel from './admin/AdminPanel'
import PendingRecipesAdmin from './admin/PendingRecipesAdmin';
import Users from './admin/Users'; // Dodajemy import komponentu Users
import Categories from './admin/Categories'; // Import komponentu Categories
import AuthorizedImage from './components/AuthorizedImage'; // Dodajemy import komponentu AuthorizedImage

function App() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Stan do przechowywania frazy wyszukiwania
  // Stany do obsługi paginacji
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 5; // Ilość przepisów na stronę

  const navigate = useNavigate();

  // Pomocnicza funkcja do pobierania wszystkich przepisów i filtrowania ich lokalnie
  const fetchAllAndFilterLocally = useCallback(async (searchTerm) => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/recipes');
      if (!res.ok) throw new Error(t('fetchRecipesError', 'Błąd podczas pobierania przepisów: ') + res.statusText);

      const data = await res.json();
      // Pobieramy przepisy z content, ponieważ API zwraca je w tej formie
      const allRecipes = data.content || [];

      // Filtrowanie po tytule LUB tagach
      const filteredRecipes = allRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm) ||
        (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );

      setRecipes(filteredRecipes);
      // Przy filtrowaniu lokalnym nie mamy informacji o paginacji, więc ustawiamy je ręcznie
      setTotalPages(1);
      setTotalElements(filteredRecipes.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/recipes?page=${currentPage}&size=${pageSize}`);
      if (!res.ok) throw new Error(t('fetchRecipesError', 'Błąd podczas pobierania przepisów: ') + res.statusText);
      const data = await res.json();
      // Poprawiona obsługa paginacji zgodnie z formatem API
      setRecipes(data.content || []);
      // Dane paginacji znajdują się w obiekcie "page"
      setTotalPages(data.page?.totalPages || 0);
      setTotalElements(data.page?.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, pageSize]);

  // Funkcja do wyszukiwania przepisów
  const searchRecipes = useCallback(async (query) => {
    if (!query.trim()) {
      fetchRecipes(); // Jeśli zapytanie jest puste, pobierz wszystkie przepisy
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    setLoading(true);
    setError(null);

    try {
      // Najpierw próbujemy użyć endpointu wyszukiwania w API
      const res = await fetch(`http://localhost:8080/api/v1/recipes/search?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&size=${pageSize}`);

      if (!res.ok) {
        // Jeśli endpoint wyszukiwania nie jest dostępny lub wystąpił błąd,
        // pobieramy wszystkie przepisy i filtrujemy je po stronie klienta
        console.warn("Wyszukiwanie API zwróciło błąd, używam lokalnego filtrowania");
        await fetchAllAndFilterLocally(searchTerm);
        return;
      }

      const data = await res.json();
      // Poprawiona obsługa paginacji zgodnie z formatem API
      let results = data.content || [];
      // Dane paginacji znajdują się w obiekcie "page"
      setTotalPages(data.page?.totalPages || 0);
      setTotalElements(data.page?.totalElements || 0);

      // Dodatkowa walidacja czy wyniki zawierają również przepisy z pasującymi tagami
      // (na wypadek gdyby backend szukał tylko w tytułach)
      if (results.length > 0) {
        // Sprawdzamy czy backend już uwzględnił tagi w wyszukiwaniu
        const hasTagMatches = results.some(recipe =>
          recipe.tags && recipe.tags.some(tag =>
            tag.toLowerCase().includes(searchTerm)
          )
        );

        // Jeśli nie ma dopasowań tagów w wynikach, wykonujemy dodatkowe lokalne filtrowanie
        if (!hasTagMatches) {
          await fetchAllAndFilterLocally(searchTerm);
          return;
        }
      } else {
        // Jeśli nie ma wyników, spróbuj wyszukać lokalnie po tagach
        await fetchAllAndFilterLocally(searchTerm);
        return;
      }

      setRecipes(results);
    } catch (err) {
      console.error("Błąd podczas wyszukiwania:", err);
      // W przypadku błędu, spróbuj lokalnie
      await fetchAllAndFilterLocally(searchTerm);
    } finally {
      setLoading(false);
    }
  }, [t, currentPage, pageSize, fetchAllAndFilterLocally]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Nasłuchiwanie na zmiany w przepisach (oceny, ulubione)
  useEffect(() => {
    const handleRecipeChange = () => {
      fetchRecipes();
    };

    window.addEventListener('recipeChange', handleRecipeChange);

    return () => {
      window.removeEventListener('recipeChange', handleRecipeChange);
    };
  }, [fetchRecipes]);

  return (
    <div className="App bg-light">
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <main className="container py-4">
              <section className="row justify-content-center mb-4">
                <div className="col-md-8">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchRecipes(searchQuery)}
                    />
                    <button
                      className="btn btn-warning"
                      onClick={() => searchRecipes(searchQuery)}
                    >{t('searchButton')}</button>
                  </div>
                </div>
              </section>
              <section className="row">
                <div className="col-12">
                  <h2 className="mb-3">{t('recipesList')}</h2>
                  <div className="recipes-list">
                    {loading && <p className="text-warning">{t('loading', 'Ładowanie...')}</p>}
                    {error && <p className="text-danger">{error}</p>}
                    {!loading && !error && recipes.length === 0 && <p>{t('noRecipes')}</p>}
                    {!loading && !error && recipes.length > 0 && (
                      <>
                        <ul className="list-unstyled">
                          {recipes.map(recipe => (
                            <li
                              key={recipe.id}
                              className="recipe-item mb-4 p-3 bg-white rounded shadow-sm"
                              onClick={() => navigate(`/recipes/${recipe.id}`)}
                            >
                              <div className="row">
                                {/* Zdjęcie główne */}
                                <div className="col-md-3">
                                  {recipe.mainImageUrl ? (
                                    <AuthorizedImage
                                      src={recipe.mainImageUrl}
                                      alt={recipe.title}
                                      className="img-fluid rounded"
                                      style={{ height: '150px', objectFit: 'cover', width: '100%' }}
                                    />
                                  ) : (
                                    <div className="no-image-placeholder rounded" style={{ height: '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span className="text-muted">{t('noImage', 'Brak zdjęcia')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Informacje o przepisie */}
                                <div className="col-md-9">
                                  <h3 className="mb-2">{recipe.title}</h3>

                                  <p className="recipe-author mb-2">
                                    <i className="fas fa-user me-1 text-secondary"></i> {recipe.author.firstName} {recipe.author.lastName}
                                  </p>

                                  <div className="recipe-meta d-flex align-items-center flex-wrap gap-3 mb-3">
                                    <span className="d-inline-flex align-items-center">
                                      <i className="fas fa-star text-warning me-2"></i>
                                      <span>{recipe.rate ? recipe.rate.toFixed(1) : '0.0'}</span>
                                      <small className="text-muted ms-1">({recipe.ratingCount || 0})</small>
                                    </span>
                                    <span className="d-inline-flex align-items-center">
                                      <i className="fas fa-heart text-danger me-2"></i>
                                      <span>{recipe.favoritesCount || 0}</span>
                                    </span>
                                    <span className="d-inline-flex align-items-center">
                                      <i className="fas fa-clock text-primary me-2"></i>
                                      <span>{recipe.estimatedTimeToPrepare || t('unknown', 'nieznany')}</span>
                                    </span>
                                  </div>

                                  {/* Tagi zamiast opisu */}
                                  <div className="recipe-tags mt-2">
                                    {recipe.tags && recipe.tags.length > 0 ? (
                                      recipe.tags.map((tag, index) => (
                                        <span
                                          key={index}
                                          className="badge rounded-pill bg-light text-dark border me-2 mb-2"
                                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                        >
                                          {tag}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-muted">{t('noTags', 'Brak tagów')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>

                        {/* Kontrolki nawigacyjne paginacji */}
                        <div className="d-flex justify-content-center mt-4">
                          <nav aria-label="Page navigation">
                            <ul className="pagination">
                              {/* Przycisk Poprzednia strona */}
                              <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                  disabled={currentPage === 0}
                                >
                                  &laquo; {t('previous', 'Poprzednia')}
                                </button>
                              </li>

                              {/* Numery stron - wyświetlamy max 5 numerów stron */}
                              {[...Array(totalPages)].map((_, index) => {
                                // Pokazuj tylko strony w zakresie +/- 2 od obecnej
                                if (
                                  index === 0 || // Zawsze pokazuj pierwszą stronę
                                  index === totalPages - 1 || // Zawsze pokazuj ostatnią stronę
                                  (index >= currentPage - 1 && index <= currentPage + 1) // Pokazuj strony obok bieżącej
                                ) {
                                  return (
                                    <li key={index} className={`page-item ${currentPage === index ? 'active' : ''}`}>
                                      <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(index)}
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
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                  disabled={currentPage >= totalPages - 1}
                                >
                                  {t('next', 'Następna')} &raquo;
                                </button>
                              </li>
                            </ul>
                          </nav>
                        </div>

                        {/* Informacja o wyświetlanych przepisach */}
                        <div className="text-center text-muted mt-2">
                          {t('showingRecipes', 'Wyświetlanie {{start}}-{{end}} z {{total}} przepisów', {
                            start: totalElements === 0 ? 0 : currentPage * pageSize + 1,
                            end: Math.min((currentPage + 1) * pageSize, totalElements),
                            total: totalElements
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            </main>
          }
        />
        <Route path="/recipes/:id" element={<RecipeDetails />} />
        <Route path="/add-recipe" element={<AddRecipe />} />
        <Route path="/edit-recipe/:id" element={<EditRecipe />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />

        {/* Trasy dla panelu administratora */}
        <Route path="/admin" element={<AdminPanel />}>
          <Route index element={<PendingRecipesAdmin />} />
          <Route path="pending-recipes" element={<PendingRecipesAdmin />} />
          <Route path="users" element={<Users />} />
          <Route path="categories" element={<Categories />} />
        </Route>
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
