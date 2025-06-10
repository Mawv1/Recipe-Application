import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './RecipeDetails.css';

function RecipeDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      <p className="recipe-description">{recipe.description}</p>
      {/* Możesz dodać więcej szczegółów, np. składniki, instrukcje */}
    </div>
  );
}

export default RecipeDetails;

