import logo from './logo.svg';
import './App.css';
import Header from './Header';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import RecipeDetails from './RecipeDetails';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';

function App() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:8080/api/v1/recipes')
      .then(res => {
        if (!res.ok) throw new Error(t('fetchRecipesError', 'Błąd podczas pobierania przepisów: ') + res.statusText);
        return res.json();
      })
      .then(data => {
        setRecipes(data.content || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [t]);

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
                            className="recipe-item"
                            onClick={() => navigate(`/recipes/${recipe.id}`)}
                          >
                            <h3>{recipe.title}</h3>
                            <p>{recipe.description}</p>
                            <div className="recipe-meta">
                              {t('author')}: {recipe.author.firstName} {recipe.author.lastName} | {t('rate')}: {recipe.rate} | {t('estimatedTime')}: {recipe.estimatedTimeToPrepare}
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
