import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function PendingRecipesAdmin() {
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingRecipes();
  }, []);

  const fetchPendingRecipes = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      console.log('Próba pobrania danych...');
      const response = await fetch('http://localhost:8080/api/v1/recipes/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('Status odpowiedzi:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Błąd odpowiedzi:', errorText);
        throw new Error(`Błąd pobierania przepisów: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Otrzymane dane:', data);

      // Sprawdzamy strukturę odpowiedzi
      if (Array.isArray(data)) {
        setPendingRecipes(data);
      } else if (data.content && Array.isArray(data.content)) {
        setPendingRecipes(data.content);
      } else {
        console.error('Nieoczekiwana struktura danych:', data);
        setPendingRecipes([]);
      }
    } catch (err) {
      console.error('Błąd podczas pobierania danych:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    const token = localStorage.getItem('token');
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/recipes/${id}/status?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Błąd zmiany statusu');
      setSuccess('Status zmieniony!');
      fetchPendingRecipes();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Oczekujące przepisy</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {loading ? <Spinner animation="border" /> : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tytuł</th>
              <th>Autor</th>
              <th>Data dodania</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {pendingRecipes.length === 0 && (
              <tr><td colSpan="5" className="text-center">Brak oczekujących przepisów</td></tr>
            )}
            {pendingRecipes.map(recipe => (
              <tr key={recipe.id}>
                <td>{recipe.id}</td>
                <td>{recipe.title}</td>
                <td>{recipe.author.firstName + ' ' + recipe.author.lastName || '-'}</td>
                <td>{recipe.dateOfCreation ? new Date(recipe.dateOfCreation).toLocaleString() : '-'}</td>
                <td>
                  <Button variant="success" size="sm" className="me-2" onClick={() => handleStatusChange(recipe.id, 'ACCEPTED')}>Akceptuj</Button>
                  <Button variant="danger" size="sm" onClick={() => handleStatusChange(recipe.id, 'REJECTED')}>Odrzuć</Button>
                  <Button variant="outline-primary" size="sm" className="ms-2" onClick={() => navigate(`/recipes/${recipe.id}`)}>Podgląd</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default PendingRecipesAdmin;
