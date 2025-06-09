import logo from './logo.svg';
import './App.css';
import Header from './Header';
import Footer from './Footer';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:8080/api/v1/recipes', {
      headers: {
        'Authorization': token ? 'Bearer ' + token : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Błąd podczas pobierania przepisów: ' + res.statusText);
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
  }, []);

  return (
    <div className="App">
      <Header />
      <main>
        <section className="search-section">
          <input type="text" className="search-input" placeholder={t('searchPlaceholder')} />
          <button className="search-btn">{t('searchButton')}</button>
        </section>
        <section>
          <h2>{t('recipesList')}</h2>
          <div className="recipes-list">
            {loading && <p>Ładowanie...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}
            {!loading && !error && recipes.length === 0 && <p>{t('noRecipes')}</p>}
            {!loading && !error && recipes.length > 0 && (
              <ul style={{listStyle: 'none', padding: 0}}>
                {recipes.map(recipe => (
                  <li
                    key={recipe.id}
                    style={{marginBottom: '24px', textAlign: 'left', borderBottom: '1px solid #eee', paddingBottom: '16px', cursor: 'pointer'}}
                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                  >
                    <h3 style={{margin: 0}}>{recipe.title}</h3>
                    <p style={{margin: '8px 0'}}>{recipe.description}</p>
                    <div style={{fontSize: '0.95rem', color: '#555'}}>
                      {t('author')}: {recipe.author.firstName} {recipe.author.lastName} | {t('rate')}: {recipe.rate} | {t('estimatedTime')}: {recipe.estimatedTimeToPrepare}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default App;
