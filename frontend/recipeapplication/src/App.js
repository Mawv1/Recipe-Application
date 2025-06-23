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
import AuthorizedImage from './components/AuthorizedImage'; // Dodajemy import komponentu AuthorizedImage

function App() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/api/v1/recipes');
      if (!res.ok) throw new Error(t('fetchRecipesError', 'Błąd podczas pobierania przepisów: ') + res.statusText);
      const data = await res.json();
      setRecipes(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

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
                    <input type="text" className="form-control" placeholder={t('searchPlaceholder')} />
                    <button className="btn btn-warning">{t('searchButton')}</button>
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
        </Route>
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
